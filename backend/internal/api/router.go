package api

import (
	"net/http"
	"strings"
	"time"

	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/nan0/backend/internal/cache"
	"github.com/nan0/backend/internal/crypto"
	"github.com/nan0/backend/internal/handler"
	"github.com/nan0/backend/internal/middleware"
	"github.com/nan0/backend/internal/store"
)

type Config struct {
	DB             *store.Store
	Cache          *cache.Cache
	JWTSecret      string
	SupabaseURL    string
	EncryptionKey  string
	AuditHMACKey   string
	AllowedOrigins string
}

func NewRouter(cfg Config) http.Handler {
	r := chi.NewRouter()

	// Core middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))

	// Sentry
	sentryHandler := sentryhttp.New(sentryhttp.Options{Repanic: true})
	r.Use(sentryHandler.Handle)

	// CORS
	origins := strings.Split(cfg.AllowedOrigins, ",")
	if len(origins) == 0 || (len(origins) == 1 && origins[0] == "") {
		origins = []string{"http://localhost:3000"}
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Add request ID to sentry
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			if hub := sentry.GetHubFromContext(req.Context()); hub != nil {
				hub.Scope().SetTag("request_id", chimiddleware.GetReqID(req.Context()))
			}
			w.Header().Set("X-Request-ID", chimiddleware.GetReqID(req.Context()))
			next.ServeHTTP(w, req)
		})
	})

	// Init encryption engine
	var cryptoEngine *crypto.Engine
	if cfg.EncryptionKey != "" {
		var err error
		cryptoEngine, err = crypto.New(cfg.EncryptionKey)
		if err != nil {
			panic("invalid encryption key: " + err.Error())
		}
	}

	// Health check (public)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"nano"}`))
	})

	// Handlers
	h := &handler.Handler{
		DB:           cfg.DB,
		Cache:        cfg.Cache,
		Crypto:       cryptoEngine,
		AuditHMACKey: []byte(cfg.AuditHMACKey),
	}

	// Auth middleware factory
	jwtAuth := middleware.AuthMiddleware(cfg.JWTSecret, cfg.SupabaseURL, cfg.DB)

	// API v1
	r.Route("/v1", func(r chi.Router) {
		// Org setup (needs auth but no org yet)
		r.With(jwtAuth).Post("/orgs", h.CreateOrg)
		r.With(jwtAuth).Get("/orgs/me", h.GetMyOrg)
		r.With(jwtAuth).Get("/me", h.GetMe)

		// Protected routes - need auth + org
		r.Group(func(r chi.Router) {
			r.Use(jwtAuth)
			r.Use(middleware.RequireOrg)

			// Projects
			r.Get("/projects", h.ListProjects)
			r.Post("/projects", h.CreateProject)
			r.Get("/projects/{pid}", h.GetProject)
			r.Delete("/projects/{pid}", h.DeleteProject)

			// Environments
			r.Get("/projects/{pid}/envs", h.ListEnvironments)
			r.Post("/projects/{pid}/envs", h.CreateEnvironment)

			// Secrets
			r.Get("/projects/{pid}/envs/{eid}/secrets", h.ListSecrets)
			r.Post("/projects/{pid}/envs/{eid}/secrets", h.CreateSecret)
			r.Get("/secrets/{sid}", h.GetSecret)
			r.Put("/secrets/{sid}", h.UpdateSecret)
			r.Delete("/secrets/{sid}", h.DeleteSecret)
			r.Get("/secrets/{sid}/versions", h.ListSecretVersions)

			// Audit log
			r.Get("/orgs/me/audit", h.ListAuditEvents)

			// API Tokens
			r.Get("/tokens", h.ListAPITokens)
			r.Post("/tokens", h.CreateAPIToken)
			r.Delete("/tokens/{tid}", h.RevokeAPIToken)

			// Users / members
			r.Get("/orgs/me/members", h.ListMembers)
		})

		// API token authenticated routes (for SDK/CLI access)
		r.Group(func(r chi.Router) {
			r.Use(middleware.APITokenMiddleware(cfg.DB))
			r.Use(middleware.RequireOrg)
			r.Get("/envs/{eid}/secrets/values", h.BulkPullSecrets)
		})
	})

	return r
}
