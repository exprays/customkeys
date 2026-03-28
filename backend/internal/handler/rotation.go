package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/nan0/backend/internal/model"
	"github.com/nan0/backend/internal/respond"
)

type createRotationRequest struct {
	IntervalHours int                   `json:"interval_hours"`
	Backend       model.RotationBackend `json:"backend"`
	Config        json.RawMessage       `json:"config"`
}

func (h *Handler) CreateRotationSchedule(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.Error(w, http.StatusForbidden, "no organization")
		return
	}
	role := getRole(r)
	if !isAdminOrAbove(role) {
		respond.Error(w, http.StatusForbidden, "admin required")
		return
	}

	secretID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid secret id")
		return
	}

	var req createRotationRequest
	if err := respond.Decode(r, &req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request")
		return
	}
	if req.IntervalHours <= 0 {
		req.IntervalHours = 720
	}
	if req.Backend == "" {
		req.Backend = model.RotationWebhook
	}
	if req.Config == nil {
		req.Config = json.RawMessage("{}")
	}

	userID, _ := getUserID(r)
	sched, err := h.Store.CreateRotationSchedule(r.Context(), secretID, userID, req.IntervalHours, req.Backend, req.Config)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to create schedule")
		return
	}

	h.writeAudit(r, orgID, userID, "user", "rotation.created", "secret", &secretID, map[string]any{
		"backend": req.Backend,
	})
	respond.Created(w, sched)
}

func (h *Handler) TriggerRotation(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.Error(w, http.StatusForbidden, "no organization")
		return
	}
	role := getRole(r)
	if !isAdminOrAbove(role) {
		respond.Error(w, http.StatusForbidden, "admin required")
		return
	}

	secretID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid secret id")
		return
	}

	if h.Rotation == nil {
		respond.Error(w, http.StatusServiceUnavailable, "rotation worker not available")
		return
	}

	if err := h.Rotation.TriggerManual(r.Context(), secretID); err != nil {
		respond.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	userID, _ := getUserID(r)
	h.writeAudit(r, orgID, userID, "user", "rotation.triggered", "secret", &secretID, nil)
	respond.OK(w, map[string]string{"status": "rotation triggered"})
}

func (h *Handler) GetRotationSchedule(w http.ResponseWriter, r *http.Request) {
	secretID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid secret id")
		return
	}
	sched, err := h.Store.GetRotationScheduleBySecret(r.Context(), secretID)
	if err != nil {
		respond.Error(w, http.StatusNotFound, "no rotation schedule")
		return
	}
	respond.OK(w, sched)
}

func (h *Handler) ListRotationHistory(w http.ResponseWriter, r *http.Request) {
	secretID, err := uuid.Parse(chi.URLParam(r, "sid"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid secret id")
		return
	}
	history, err := h.Store.ListRotationHistory(r.Context(), secretID, 20)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to list history")
		return
	}
	if history == nil {
		history = []*model.RotationHistory{}
	}
	respond.OK(w, history)
}

func (h *Handler) DeleteRotationSchedule(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.Error(w, http.StatusForbidden, "no organization")
		return
	}
	role := getRole(r)
	if !isAdminOrAbove(role) {
		respond.Error(w, http.StatusForbidden, "admin required")
		return
	}
	schedID, err := uuid.Parse(chi.URLParam(r, "schedid"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid schedule id")
		return
	}
	if err := h.Store.DeleteRotationSchedule(r.Context(), schedID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to delete schedule")
		return
	}
	userID, _ := getUserID(r)
	h.writeAudit(r, orgID, userID, "user", "rotation.deleted", "rotation_schedule", &schedID, nil)
	respond.NoContent(w)
}

func isAdminOrAbove(role model.Role) bool {
	return role == model.RoleOwner || role == model.RoleAdmin
}
