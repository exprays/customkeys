package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/joho/godotenv"

	"github.com/nan0/backend/internal/api"
	"github.com/nan0/backend/internal/cache"
	"github.com/nan0/backend/internal/store"
)

func main() {
	// Load .env in development
	_ = godotenv.Load()

	// Init Sentry
	sentryDSN := os.Getenv("SENTRY_DSN")
	if sentryDSN != "" {
		if err := sentry.Init(sentry.ClientOptions{
			Dsn:              sentryDSN,
			Environment:      os.Getenv("APP_ENV"),
			TracesSampleRate: 0.2,
			EnableTracing:    true,
		}); err != nil {
			log.Printf("Sentry init failed: %v", err)
		}
		defer sentry.Flush(2 * time.Second)
		log.Println("Sentry initialized")
	}

	// DB
	db, err := store.New(os.Getenv("DATABASE_URL"))
	if err != nil {
		sentry.CaptureException(err)
		log.Fatalf("DB connect failed: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := store.Migrate(os.Getenv("DATABASE_URL"), "migrations"); err != nil {
		log.Printf("Migration warning: %v", err)
	}

	// Redis cache
	rdb, err := cache.New(os.Getenv("REDIS_URL"))
	if err != nil {
		log.Printf("Redis connect warning (non-fatal): %v", err)
	}

	// Build router
	router := api.NewRouter(api.Config{
		DB:             db,
		Cache:          rdb,
		JWTSecret:      os.Getenv("SUPABASE_JWT_SECRET"),
		SupabaseURL:    os.Getenv("SUPABASE_URL"),
		EncryptionKey:  os.Getenv("ENCRYPTION_KEY"),
		AuditHMACKey:   os.Getenv("AUDIT_HMAC_KEY"),
		AllowedOrigins: os.Getenv("ALLOWED_ORIGINS"),
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("Nano API server starting on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			sentry.CaptureException(err)
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-quit
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Forced shutdown: %v", err)
	}
	log.Println("Server stopped")
}
