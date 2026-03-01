package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/jwtauth/v5"
	"github.com/hadi/kidtube/internal/auth"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/handler"
	"github.com/hadi/kidtube/internal/worker"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	// Initialize JWT auth — panics if JWT_SECRET is not set
	auth.Init()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	database, err := db.Connect(ctx, mongoURI)
	if err != nil {
		log.Fatalf("admin-api: failed to connect to MongoDB: %v", err)
	}

	if err := db.EnsureIndexes(context.Background(), database); err != nil {
		log.Fatalf("admin-api: failed to ensure indexes: %v", err)
	}

	// Read HLS root from env — must match docker-compose.yml volume mount for admin-api
	hlsRoot := os.Getenv("HLS_ROOT")
	if hlsRoot == "" {
		hlsRoot = "./data/hls"
	}

	// Create a cancellable context for the worker goroutine.
	// Cancel is deferred so the worker stops cleanly before the process exits.
	workerCtx, workerCancel := context.WithCancel(context.Background())
	defer workerCancel()

	// Start the sequential ingestion worker BEFORE accepting HTTP requests.
	worker.Start(workerCtx, database, hlsRoot)

	// Re-enqueue any pending/in-progress jobs left over from a previous server run.
	worker.ResumeJobs(context.Background(), database)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Public routes
	r.Get("/healthz", handler.HealthHandler(database))
	r.Post("/auth/login", handler.Login(database))

	// Protected routes — require valid JWT
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verifier(auth.TokenAuth))
		r.Use(jwtauth.Authenticator(auth.TokenAuth))
		// Phase 2 Plan 02 will add CRUD routes here.
		// When adding the episode CREATE handler, call worker.Enqueue(worker.JobRequest{...})
		// after inserting the Job document into MongoDB.
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("admin-api listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("admin-api: server error: %v", err)
		}
	}()

	<-done
	log.Println("admin-api: shutting down...")

	// Cancel the worker context first so the in-progress job can detect cancellation
	// before the HTTP server stops accepting new requests.
	workerCancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("admin-api: graceful shutdown failed: %v", err)
	}
	log.Println("admin-api: stopped")
}
