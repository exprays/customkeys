package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/nan0/backend/internal/cache"
	"github.com/nan0/backend/internal/crypto"
	"github.com/nan0/backend/internal/model"
	"github.com/nan0/backend/internal/respond"
	"github.com/nan0/backend/internal/store"
)

// Handler holds shared dependencies for all HTTP handlers.
type Handler struct {
	DB           *store.Store
	Cache        *cache.Cache
	Crypto       *crypto.Engine
	AuditHMACKey []byte
}

// --- Helpers ---

func getUserID(r *http.Request) (uuid.UUID, bool) {
	id, ok := r.Context().Value(model.CtxUserID).(uuid.UUID)
	return id, ok && id != uuid.Nil
}

func getOrgID(r *http.Request) (uuid.UUID, bool) {
	id, ok := r.Context().Value(model.CtxOrgID).(uuid.UUID)
	return id, ok && id != uuid.Nil
}

func getRole(r *http.Request) model.Role {
	role, _ := r.Context().Value(model.CtxRole).(model.Role)
	return role
}

func clientIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return strings.Split(ip, ",")[0]
	}
	return r.RemoteAddr
}

// --- Org Handlers ---

type createOrgRequest struct {
	Name string `json:"name"`
}

func (h *Handler) CreateOrg(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok {
		respond.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req createOrgRequest
	if err := respond.Decode(r, &req); err != nil || strings.TrimSpace(req.Name) == "" {
		respond.Error(w, http.StatusBadRequest, "name is required")
		return
	}

	// Check user doesn't already have an org
	user, _ := h.DB.GetUserByID(r.Context(), userID)
	if user != nil && user.OrgID != nil {
		respond.Error(w, http.StatusConflict, "user already belongs to an organization")
		return
	}

	org, err := h.DB.CreateOrganization(r.Context(), strings.TrimSpace(req.Name), model.PlanFree)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to create organization")
		return
	}

	// Assign user to org as owner
	if err := h.DB.UpdateUserOrg(r.Context(), userID, org.ID, model.RoleOwner); err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to assign org")
		return
	}

	// Write audit event
	h.writeAudit(r, org.ID, userID, "user", "org.created", "organization", &org.ID, map[string]interface{}{
		"org_name": org.Name,
	})

	respond.Created(w, org)
}

func (h *Handler) GetMyOrg(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.OK(w, nil)
		return
	}
	org, err := h.DB.GetOrganizationByID(r.Context(), orgID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to get org")
		return
	}
	respond.OK(w, org)
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok {
		respond.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	user, err := h.DB.GetUserByID(r.Context(), userID)
	if err != nil || user == nil {
		respond.Error(w, http.StatusNotFound, "user not found")
		return
	}
	respond.OK(w, user)
}

func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.Error(w, http.StatusForbidden, "no organization")
		return
	}
	members, err := h.DB.ListOrgUsers(r.Context(), orgID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "failed to list members")
		return
	}
	if members == nil {
		members = []*model.User{}
	}
	respond.OK(w, members)
}

// writeAudit is a fire-and-forget audit log writer.
func (h *Handler) writeAudit(r *http.Request, orgID, actorID uuid.UUID, actorType, action, resourceType string, resourceID *uuid.UUID, metadata map[string]interface{}) {
	event := store.BuildAuditEvent(orgID, actorID, actorType, action, resourceType, resourceID, metadata, clientIP(r), r.UserAgent())

	// Get previous HMAC for chain
	_, prevHMAC, _ := h.DB.GetLastAuditHMAC(r.Context(), orgID)
	ridStr := ""
	if resourceID != nil {
		ridStr = resourceID.String()
	}
	event.PrevHMAC = prevHMAC
	event.HMAC = crypto.HMACChain(h.AuditHMACKey, uuid.New().String(), prevHMAC, action, actorID.String(), ridStr, time.Now().UnixMicro())

	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.DB.WriteAuditEvent(bgCtx, event)
	}()
}
