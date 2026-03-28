package rotation

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/google/uuid"
	"github.com/nan0/backend/internal/crypto"
	"github.com/nan0/backend/internal/email"
	"github.com/nan0/backend/internal/model"
	"github.com/nan0/backend/internal/store"
	"github.com/nan0/backend/internal/ws"
	"github.com/redis/go-redis/v9"
)

type Worker struct {
	store  *store.Store
	crypto *crypto.Engine
	hub    *ws.Hub
	email  *email.Client
	rdb    *redis.Client
}

func NewWorker(s *store.Store, c *crypto.Engine, h *ws.Hub, e *email.Client, rdb *redis.Client) *Worker {
	return &Worker{store: s, crypto: c, hub: h, email: e, rdb: rdb}
}

// Run starts the polling loop. Call in a goroutine.
func (w *Worker) Run(ctx context.Context) {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.tick(ctx)
		}
	}
}

func (w *Worker) tick(ctx context.Context) {
	due, err := w.store.ListDueRotations(ctx)
	if err != nil {
		sentry.CaptureException(err)
		return
	}
	for _, sched := range due {
		go w.rotate(ctx, sched, "scheduler")
	}
}

// TriggerManual kicks off an immediate rotation for a secret.
func (w *Worker) TriggerManual(ctx context.Context, secretID uuid.UUID) error {
	sched, err := w.store.GetRotationScheduleBySecret(ctx, secretID)
	if err != nil {
		return fmt.Errorf("no rotation schedule: %w", err)
	}
	go w.rotate(context.Background(), sched, "manual")
	return nil
}

func (w *Worker) rotate(ctx context.Context, sched *model.RotationSchedule, triggeredBy string) {
	lockKey := fmt.Sprintf("nano:rotation:lock:%s", sched.SecretID)
	// Distributed lock via Redis SET NX EX 30
	if w.rdb != nil {
		ok, _ := w.rdb.SetNX(ctx, lockKey, "1", 30*time.Second).Result()
		if !ok {
			return // another instance has the lock
		}
		defer w.rdb.Del(ctx, lockKey)
	}

	histID := uuid.New()
	now := time.Now()
	hist := &model.RotationHistory{
		ID:          histID,
		SecretID:    sched.SecretID,
		ScheduleID:  &sched.ID,
		Status:      "pending",
		Backend:     string(sched.Backend),
		TriggeredBy: triggeredBy,
		StartedAt:   now,
	}
	_ = w.store.WriteRotationHistory(ctx, hist)

	newValue, err := w.callBackend(ctx, sched)
	finishedAt := time.Now()

	if err != nil {
		errMsg := err.Error()
		hist.Status = "failed"
		hist.ErrorMsg = &errMsg
		hist.FinishedAt = &finishedAt
		_ = w.store.WriteRotationHistory(ctx, hist)
		sentry.CaptureException(err)
		w.alertOwners(ctx, sched.SecretID, errMsg)
		return
	}

	// Encrypt new value
	encVal, encDEK, encErr := w.crypto.Encrypt(newValue)
	if encErr != nil {
		sentry.CaptureException(encErr)
		return
	}

	// Write new version
	if err := w.store.RotateSecretValue(ctx, sched.SecretID, encVal, encDEK); err != nil {
		sentry.CaptureException(err)
		return
	}

	// Update schedule
	_ = w.store.UpdateRotationAfterSuccess(ctx, sched.ID, sched.IntervalHours)

	hist.Status = "success"
	hist.FinishedAt = &finishedAt
	_ = w.store.WriteRotationHistory(ctx, hist)

	// Broadcast WebSocket invalidation
	secret, _ := w.store.GetSecretByID(ctx, sched.SecretID)
	if secret != nil && w.hub != nil {
		w.hub.Broadcast(secret.EnvID.String(), ws.InvalidationEvent{
			Type:      "secret.rotated",
			EnvID:     secret.EnvID.String(),
			SecretKey: secret.Key,
		})
	}
}

type webhookConfig struct {
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
}

func (w *Worker) callBackend(ctx context.Context, sched *model.RotationSchedule) (string, error) {
	switch sched.Backend {
	case model.RotationWebhook:
		return w.callWebhook(ctx, sched)
	case model.RotationPostgres:
		return w.rotatePostgresPassword(ctx, sched)
	default:
		return "", fmt.Errorf("unsupported backend: %s", sched.Backend)
	}
}

func (w *Worker) callWebhook(ctx context.Context, sched *model.RotationSchedule) (string, error) {
	var cfg webhookConfig
	if err := json.Unmarshal(sched.ConfigJSON, &cfg); err != nil {
		return "", fmt.Errorf("invalid webhook config: %w", err)
	}

	// Get current value to send as old_value
	secret, err := w.store.GetSecretByID(ctx, sched.SecretID)
	if err != nil {
		return "", err
	}
	currentVal := ""
	if secret != nil {
		currentVal, _ = w.crypto.Decrypt(secret.EncryptedValue, secret.EncryptedDEK)
	}

	payload := map[string]string{
		"secret_id": sched.SecretID.String(),
		"old_value": currentVal,
	}
	b, _ := json.Marshal(payload)

	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, cfg.URL, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	for k, v := range cfg.Headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("webhook call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}

	var result struct {
		NewValue string `json:"new_value"`
	}
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &result); err != nil || result.NewValue == "" {
		return "", fmt.Errorf("webhook did not return new_value")
	}
	return result.NewValue, nil
}

type postgresConfig struct {
	DSN      string `json:"dsn"`
	Username string `json:"username"`
}

func (w *Worker) rotatePostgresPassword(ctx context.Context, sched *model.RotationSchedule) (string, error) {
	var cfg postgresConfig
	if err := json.Unmarshal(sched.ConfigJSON, &cfg); err != nil {
		return "", fmt.Errorf("invalid postgres config: %w", err)
	}
	newPass := generatePassword(32)
	// We use the store's raw DB connection pattern to run ALTER ROLE
	if err := w.store.ExecRaw(ctx, cfg.DSN,
		fmt.Sprintf("ALTER ROLE %s WITH PASSWORD '%s'", cfg.Username, newPass)); err != nil {
		return "", fmt.Errorf("postgres rotation failed: %w", err)
	}
	return newPass, nil
}

func (w *Worker) alertOwners(ctx context.Context, secretID uuid.UUID, errMsg string) {
	if w.email == nil {
		return
	}
	secret, err := w.store.GetSecretByID(ctx, secretID)
	if err != nil || secret == nil {
		return
	}
	env, err := w.store.GetEnvironmentByID(ctx, secret.EnvID)
	if err != nil || env == nil {
		return
	}
	owners, err := w.store.GetOrgOwners(ctx, env.ProjectID)
	if err != nil {
		return
	}
	for _, owner := range owners {
		_ = w.email.SendRotationAlert(ctx, owner.Email, secret.Key, env.Name, errMsg)
	}
}

func generatePassword(n int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"

	// Use crypto/rand
	return randomString(n, chars)
}
