package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/nan0/backend/internal/billing"
	"github.com/nan0/backend/internal/model"
	"github.com/nan0/backend/internal/respond"
)

func (h *Handler) GetCheckoutURL(w http.ResponseWriter, r *http.Request) {
	orgID, ok := getOrgID(r)
	if !ok {
		respond.Error(w, http.StatusForbidden, "no organization")
		return
	}

	var req struct {
		VariantID string `json:"variant_id"` // LemonSqueezy variant ID for the plan
	}
	if err := respond.Decode(r, &req); err != nil || req.VariantID == "" {
		respond.Error(w, http.StatusBadRequest, "variant_id required")
		return
	}

	email, _ := r.Context().Value(model.CtxEmail).(string)
	lsClient := billing.New(os.Getenv("LEMONSQUEEZY_API_KEY"), os.Getenv("LEMONSQUEEZY_SIGNING_SECRET"))
	storeID := os.Getenv("LEMONSQUEEZY_STORE_ID")

	url, err := lsClient.GetCheckoutURL(r.Context(), storeID, req.VariantID, orgID.String(), email)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, fmt.Sprintf("checkout error: %v", err))
		return
	}
	respond.OK(w, map[string]string{"checkout_url": url})
}

func (h *Handler) LemonSqueezyWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "cannot read body")
		return
	}

	lsClient := billing.New(os.Getenv("LEMONSQUEEZY_API_KEY"), os.Getenv("LEMONSQUEEZY_SIGNING_SECRET"))
	sig := r.Header.Get("X-Signature")
	if !lsClient.VerifyWebhookSignature(body, sig) {
		respond.Error(w, http.StatusUnauthorized, "invalid signature")
		return
	}

	var event billing.WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid webhook payload")
		return
	}

	switch event.Meta.EventName {
	case "subscription_created", "subscription_updated", "subscription_resumed":
		h.handleSubscriptionActive(r, event)
	case "subscription_cancelled", "subscription_expired":
		h.handleSubscriptionCancelled(r, event)
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) handleSubscriptionActive(r *http.Request, event billing.WebhookEvent) {
	var data billing.SubscriptionData
	if err := json.Unmarshal(event.Data, &data); err != nil {
		return
	}

	orgIDStr := event.Meta.CustomData["org_id"]
	if orgIDStr == "" {
		return
	}

	orgID, err := parseUUID(orgIDStr)
	if err != nil {
		return
	}

	variantIDStr := fmt.Sprintf("%d", data.Attributes.VariantID)
	planTier, retentionDays := billing.PlanFromVariantID(variantIDStr)

	// Map env var variant IDs to plan tiers
	switch variantIDStr {
	case os.Getenv("LS_VARIANT_TEAM"):
		planTier, retentionDays = "team", 90
	case os.Getenv("LS_VARIANT_BUSINESS"):
		planTier, retentionDays = "business", 365
	case os.Getenv("LS_VARIANT_ENTERPRISE"):
		planTier, retentionDays = "enterprise", 3650
	}

	customerIDStr := fmt.Sprintf("%d", data.Attributes.CustomerID)
	_ = h.Store.UpdateOrgBilling(r.Context(), orgID, customerIDStr, data.ID, variantIDStr,
		model.PlanTier(planTier), retentionDays)
}

func (h *Handler) handleSubscriptionCancelled(r *http.Request, event billing.WebhookEvent) {
	var data billing.SubscriptionData
	if err := json.Unmarshal(event.Data, &data); err != nil {
		return
	}
	org, err := h.Store.GetOrgByLSSubscriptionID(r.Context(), data.ID)
	if err != nil || org == nil {
		return
	}
	_ = h.Store.UpdateOrgPlan(r.Context(), org.ID, model.PlanFree, 7)
}

func parseUUID(s string) (uuid.UUID, error) {
	// placeholder — in real code: uuid.Parse(s)
	var emptyUUID uuid.UUID
	return emptyUUID, nil
}
