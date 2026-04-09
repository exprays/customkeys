package middleware

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/nan0/backend/internal/crypto"
	"github.com/nan0/backend/internal/model"
	"github.com/nan0/backend/internal/respond"
	"github.com/nan0/backend/internal/store"
)

type jwksCache struct {
	mu        sync.RWMutex
	keys      map[string]interface{}
	fetchedAt time.Time
}

var globalJWKSCache = &jwksCache{keys: make(map[string]interface{})}

const jwksCacheTTL = 10 * time.Minute

// AuthMiddleware verifies Supabase JWT tokens and loads the user into context.
func AuthMiddleware(jwtSecret, supabaseURL string, db *store.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := extractBearerToken(r)
			if tokenStr == "" {
				respond.Error(w, http.StatusUnauthorized, "missing authorization token")
				return
			}

			claims, err := verifySupabaseJWT(tokenStr, jwtSecret, supabaseURL)
			if err != nil {
				fmt.Printf("JWT Verification Error: %v\n", err)
				respond.Error(w, http.StatusUnauthorized, "invalid token")
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				respond.Error(w, http.StatusUnauthorized, "invalid user ID in token")
				return
			}

			email, _ := claims.Extra["email"].(string)

			// Load or create user in our DB
			user, err := db.GetUserByID(r.Context(), userID)
			if err != nil || user == nil {
				// Auto-provision user on first login
				user, err = db.UpsertUser(r.Context(), userID, email, nil, model.RoleOwner)
				if err != nil {
					respond.Error(w, http.StatusInternalServerError, "failed to provision user")
					return
				}
			}

			// Inject into context
			ctx := context.WithValue(r.Context(), model.CtxUserID, userID)
			ctx = context.WithValue(ctx, model.CtxEmail, email)
			if user.OrgID != nil {
				ctx = context.WithValue(ctx, model.CtxOrgID, *user.OrgID)
			}
			ctx = context.WithValue(ctx, model.CtxRole, user.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// APITokenMiddleware validates API tokens (for SDK/CLI access).
func APITokenMiddleware(db *store.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := extractBearerToken(r)
			if tokenStr == "" {
				respond.Error(w, http.StatusUnauthorized, "missing authorization token")
				return
			}

			// Hash the token and look it up
			tokenHash := crypto.HashToken(tokenStr)
			token, err := db.GetAPITokenByHash(r.Context(), tokenHash)
			if err != nil || token == nil {
				respond.Error(w, http.StatusUnauthorized, "invalid or expired API token")
				return
			}

			// Update last_used_at async
			go func() {
				_ = db.TouchAPIToken(context.Background(), token.ID)
			}()

			// Load user
			user, err := db.GetUserByID(r.Context(), token.UserID)
			if err != nil || user == nil {
				respond.Error(w, http.StatusUnauthorized, "token user not found")
				return
			}

			ctx := context.WithValue(r.Context(), model.CtxUserID, token.UserID)
			if user.OrgID != nil {
				ctx = context.WithValue(ctx, model.CtxOrgID, *user.OrgID)
			}
			ctx = context.WithValue(ctx, model.CtxRole, user.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireOrg ensures the user has an org. Used after AuthMiddleware.
func RequireOrg(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		orgID, ok := r.Context().Value(model.CtxOrgID).(uuid.UUID)
		if !ok || orgID == uuid.Nil {
			respond.Error(w, http.StatusForbidden, "no organization — create one first")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireRole ensures the user has at least the given role.
func RequireRole(minRole model.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(model.CtxRole).(model.Role)
			order := map[model.Role]int{
				model.RoleReader: 1, model.RoleDeveloper: 2,
				model.RoleAdmin: 3, model.RoleOwner: 4,
			}
			if order[role] < order[minRole] {
				respond.Error(w, http.StatusForbidden, "insufficient permissions")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// SupabaseClaims represents the JWT claims from Supabase.
type SupabaseClaims struct {
	jwt.RegisteredClaims
	Extra map[string]interface{}
}

func (c *SupabaseClaims) GetClaimsMap() map[string]interface{} {
	return c.Extra
}

func verifySupabaseJWT(tokenStr, secret, supabaseURL string) (*SupabaseClaims, error) {
	claims := &SupabaseClaims{Extra: make(map[string]interface{})}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		fmt.Printf("JWT Callback: Alg=%v, Kid=%v\n", t.Method.Alg(), t.Header["kid"])
		switch t.Method.(type) {
		case *jwt.SigningMethodHMAC:
			if secret == "" {
				return nil, fmt.Errorf("SUPABASE_JWT_SECRET is required for HMAC tokens")
			}
			return []byte(secret), nil
		case *jwt.SigningMethodRSA, *jwt.SigningMethodECDSA:
			kid, _ := t.Header["kid"].(string)
			if kid == "" {
				return nil, fmt.Errorf("token missing kid header")
			}
			pubKey, keyErr := getPublicKeyFromJWKS(supabaseURL, kid)
			if keyErr != nil {
				return nil, keyErr
			}
			return pubKey, nil
		default:
			return nil, jwt.ErrSignatureInvalid
		}
	})
	if err != nil || !token.Valid {
		return nil, err
	}

	// Extract extra claims (email, role etc.) from the raw token
	if mapClaims, ok := token.Claims.(jwt.MapClaims); ok {
		for k, v := range mapClaims {
			claims.Extra[k] = v
		}
	}

	return claims, nil
}

type jwkSet struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
	X   string `json:"x"`
	Y   string `json:"y"`
	Crv string `json:"crv"`
}

func getPublicKeyFromJWKS(supabaseURL, kid string) (interface{}, error) {
	if supabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required for token verification")
	}

	now := time.Now()
	globalJWKSCache.mu.RLock()
	if now.Sub(globalJWKSCache.fetchedAt) < jwksCacheTTL {
		if key, ok := globalJWKSCache.keys[kid]; ok {
			globalJWKSCache.mu.RUnlock()
			return key, nil
		}
	}
	globalJWKSCache.mu.RUnlock()

	if err := refreshJWKSCache(supabaseURL); err != nil {
		return nil, err
	}

	globalJWKSCache.mu.RLock()
	defer globalJWKSCache.mu.RUnlock()
	key, ok := globalJWKSCache.keys[kid]
	if !ok {
		return nil, fmt.Errorf("kid not found in JWKS: %s", kid)
	}
	return key, nil
}

func refreshJWKSCache(supabaseURL string) error {
	url := strings.TrimRight(supabaseURL, "/") + "/auth/v1/.well-known/jwks.json"

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("jwks request failed: %s", resp.Status)
	}

	var set jwkSet
	if err := json.NewDecoder(resp.Body).Decode(&set); err != nil {
		return err
	}

	newKeys := make(map[string]interface{})
	for _, key := range set.Keys {
		if key.Kid == "" {
			continue
		}
		if key.Kty == "RSA" && key.N != "" && key.E != "" {
			pub, err := rsaPublicKeyFromJWK(key.N, key.E)
			if err == nil {
				newKeys[key.Kid] = pub
			}
		} else if key.Kty == "EC" && key.X != "" && key.Y != "" && key.Crv != "" {
			pub, err := ecdsaPublicKeyFromJWK(key.Crv, key.X, key.Y)
			if err == nil {
				newKeys[key.Kid] = pub
			}
		}
	}

	if len(newKeys) == 0 {
		return fmt.Errorf("jwks did not contain usable keys")
	}

	globalJWKSCache.mu.Lock()
	globalJWKSCache.keys = newKeys
	globalJWKSCache.fetchedAt = time.Now()
	globalJWKSCache.mu.Unlock()

	return nil
}

func rsaPublicKeyFromJWK(nBase64URL, eBase64URL string) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(nBase64URL)
	if err != nil {
		return nil, err
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(eBase64URL)
	if err != nil {
		return nil, err
	}

	n := new(big.Int).SetBytes(nBytes)
	e := new(big.Int).SetBytes(eBytes)
	if !e.IsInt64() {
		return nil, fmt.Errorf("invalid RSA exponent")
	}

	pub := &rsa.PublicKey{N: n, E: int(e.Int64())}
	if pub.E <= 0 {
		return nil, fmt.Errorf("invalid RSA exponent value")
	}
	return pub, nil
}

func ecdsaPublicKeyFromJWK(crv, xBase64URL, yBase64URL string) (*ecdsa.PublicKey, error) {
	var curve elliptic.Curve
	switch crv {
	case "P-256":
		curve = elliptic.P256()
	case "P-384":
		curve = elliptic.P384()
	case "P-521":
		curve = elliptic.P521()
	default:
		return nil, fmt.Errorf("unsupported curve: %s", crv)
	}

	xBytes, err := base64.RawURLEncoding.DecodeString(xBase64URL)
	if err != nil {
		return nil, err
	}
	yBytes, err := base64.RawURLEncoding.DecodeString(yBase64URL)
	if err != nil {
		return nil, err
	}

	x := new(big.Int).SetBytes(xBytes)
	y := new(big.Int).SetBytes(yBytes)

	pub := &ecdsa.PublicKey{Curve: curve, X: x, Y: y}
	if !curve.IsOnCurve(x, y) {
		return nil, fmt.Errorf("invalid ECDSA public key")
	}
	return pub, nil
}

func extractBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	// Also allow customkeys_token_ prefix for API tokens in query string (CLI use)
	if q := r.URL.Query().Get("token"); q != "" {
		return q
	}
	return ""
}
