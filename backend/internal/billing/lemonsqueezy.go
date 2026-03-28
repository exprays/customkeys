package billing

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const lsBaseURL = "https://api.lemonsqueezy.com/v1"

type Client struct {
	apiKey     string
	signingKey string
	httpClient *http.Client
}

func New(apiKey, signingKey string) *Client {
	return &Client{
		apiKey:     apiKey,
		signingKey: signingKey,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// VerifyWebhookSignature validates the X-Signature header from LemonSqueezy.
func (c *Client) VerifyWebhookSignature(payload []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(c.signingKey))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

// WebhookEvent is the top-level envelope LemonSqueezy sends.
type WebhookEvent struct {
	Meta WebhookMeta     `json:"meta"`
	Data json.RawMessage `json:"data"`
}

type WebhookMeta struct {
	EventName  string            `json:"event_name"`
	CustomData map[string]string `json:"custom_data"`
}

// SubscriptionAttributes covers the fields we care about in subscription events.
type SubscriptionAttributes struct {
	CustomerID int    `json:"customer_id"`
	OrderID    int    `json:"order_id"`
	ProductID  int    `json:"product_id"`
	VariantID  int    `json:"variant_id"`
	Status     string `json:"status"`
	UserEmail  string `json:"user_email"`
}

type SubscriptionData struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Attributes SubscriptionAttributes `json:"attributes"`
}

// GetCheckoutURL creates a checkout link for a given variant.
func (c *Client) GetCheckoutURL(ctx context.Context, storeID, variantID, orgID, userEmail string) (string, error) {
	body := map[string]any{
		"data": map[string]any{
			"type": "checkouts",
			"attributes": map[string]any{
				"checkout_data": map[string]any{
					"email": userEmail,
					"custom": map[string]string{
						"org_id": orgID,
					},
				},
			},
			"relationships": map[string]any{
				"store": map[string]any{
					"data": map[string]string{"type": "stores", "id": storeID},
				},
				"variant": map[string]any{
					"data": map[string]string{"type": "variants", "id": variantID},
				},
			},
		},
	}

	b, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, lsBaseURL+"/checkouts", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Accept", "application/vnd.api+json")
	req.Header.Set("Content-Type", "application/vnd.api+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		raw, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("lemonsqueezy checkout error %d: %s", resp.StatusCode, string(raw))
	}

	var result struct {
		Data struct {
			Attributes struct {
				URL string `json:"url"`
			} `json:"attributes"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Data.Attributes.URL, nil
}

// PlanFromVariant maps a LemonSqueezy variant ID to a plan tier.
// Populate these from your LemonSqueezy dashboard variant IDs.
func PlanFromVariantID(variantID string) (string, int) {
	// Returns (planTier, auditRetentionDays)
	// These IDs should be set via env vars — this is a fallback map
	switch variantID {
	case "team":
		return "team", 90
	case "business":
		return "business", 365
	case "enterprise":
		return "enterprise", 3650
	default:
		return "free", 7
	}
}
