package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/nan0/backend/internal/billing"
	"github.com/nan0/backend/internal/crypto"
	"github.com/nan0/backend/internal/model"
	"github.com/nan0/backend/internal/rbac"
	"github.com/nan0/backend/internal/respond"
)

// --- Audit Log ---

func (h *Handler) ListAuditEvents(w http.ResponseWriter, r *http.Request) {
	orgID, _ := getOrgID(r)
	role := getRole(r)

	if !rbac.HasPermission(role, rbac.PermViewAudit) {
		respond.Error(w, http.StatusForbidden, "insufficient permissions to view audit log")
		return
	}

	limit := 50
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 200 {
			limit = v
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil && v >= 0 {
			offset = v
		}
	}

	action := r.URL.Query().Get("action")

	events, err := h.DB.ListAuditEvents(r.Context(), orgID, limit, offset, action)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to fetch audit log")
		return
	}
	if events == nil {
		events = []*model.AuditEvent{}
	}

	respond.OK(w, map[string]interface{}{
		"events": events,
		"limit":  limit,
		"offset": offset,
	})
}

// --- API Tokens ---

type createTokenRequest struct {
	Name      string     `json:"name"`
	Scopes    []string   `json:"scopes"`
	ExpiresAt *time.Time `json:"expires_at"`
}

func (h *Handler) ListAPITokens(w http.ResponseWriter, r *http.Request) {
	userID, _ := getUserID(r)

	tokens, err := h.DB.ListAPITokensByUser(r.Context(), userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to list tokens")
		return
	}
	if tokens == nil {
		tokens = []*model.APIToken{}
	}

	// Strip hashes from response
	for _, t := range tokens {
		t.TokenHash = ""
	}

	respond.OK(w, tokens)
}

func (h *Handler) CreateAPIToken(w http.ResponseWriter, r *http.Request) {
	orgID, _ := getOrgID(r)
	userID, _ := getUserID(r)

	var req createTokenRequest
	if err := respond.Decode(r, &req); err != nil || req.Name == "" {
		respond.Error(w, http.StatusBadRequest, "name is required")
		return
	}

	if len(req.Scopes) == 0 {
		req.Scopes = []string{"secrets:read"}
	}

	// ── Plan enforcement: API token count ──
	org, _ := h.Store.GetOrganizationByID(r.Context(), orgID)
	if org != nil {
		limits := billing.GetLimits(org.PlanTier)
		tokenCount, _ := h.Store.CountOrgAPITokens(r.Context(), orgID)
		if billing.ExceedsLimit(limits.MaxAPITokens, tokenCount) {
			respond.Error(w, http.StatusPaymentRequired, fmt.Sprintf("API token limit reached (%d on %s plan) — upgrade to create more", limits.MaxAPITokens, org.PlanTier))
			return
		}
	}

	// Generate a secure token: nano_ prefix for easy identification
	rawToken, err := crypto.GenerateSecureToken(32)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to generate token")
		return
	}
	plainToken := "nano_" + rawToken
	tokenHash := crypto.HashToken(plainToken)

	token, err := h.DB.CreateAPIToken(r.Context(), orgID, userID, req.Name, tokenHash, req.Scopes, req.ExpiresAt)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to create token")
		return
	}

	token.PlainToken = plainToken
	token.TokenHash = ""

	h.writeAudit(r, orgID, userID, "user", "token.created", "token", &token.ID, map[string]interface{}{
		"token_name": token.Name,
		"scopes":     token.Scopes,
	})

	respond.Created(w, token)
}

func (h *Handler) RevokeAPIToken(w http.ResponseWriter, r *http.Request) {
	tid, err := uuid.Parse(chi.URLParam(r, "tid"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid token ID")
		return
	}

	orgID, _ := getOrgID(r)
	userID, _ := getUserID(r)

	if err := h.DB.RevokeAPIToken(r.Context(), tid, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to revoke token")
		return
	}

	// Optionally add to Redis blocklist
	if h.Cache != nil {
		_ = h.Cache.RevokeToken(r.Context(), tid.String())
	}

	h.writeAudit(r, orgID, userID, "user", "token.revoked", "token", &tid, nil)

	respond.NoContent(w)
}

// Append to existing audit_token.go

func (h *Handler) GetOrgUsage(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.Error(w, http.StatusForbidden, "no organization")
		return
	}
	org, err := h.Store.GetOrganizationByID(r.Context(), orgID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to get org")
		return
	}
	members, _ := h.Store.ListOrgUsers(r.Context(), orgID)
	respond.OK(w, map[string]any{
		"plan":       org.PlanTier,
		"seat_count": len(members),
		"seat_limit": seatLimitForPlan(org.PlanTier),
	})
}
