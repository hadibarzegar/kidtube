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

	// tokenFromAdminCookie reads the admin_token cookie for browser-based auth.
	// Client-side apiFetch in admin-app sends credentials:'include' (no Bearer header).
	tokenFromAdminCookie := func(r *http.Request) string {
		cookie, err := r.Cookie("admin_token")
		if err != nil {
			return ""
		}
		return cookie.Value
	}

	// Protected routes — require valid JWT
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromAdminCookie))
		r.Use(jwtauth.Authenticator(auth.TokenAuth))

		r.Route("/channels", func(r chi.Router) {
			r.Get("/", handler.ListChannels(database))
			r.Post("/", handler.CreateChannel(database))
			r.Get("/{id}", handler.GetChannel(database))
			r.Put("/{id}", handler.UpdateChannel(database))
			r.Delete("/{id}", handler.DeleteChannel(database))
		})
		r.Route("/episodes", func(r chi.Router) {
			r.Get("/", handler.ListEpisodes(database))
			r.Post("/", handler.CreateEpisode(database))
			r.Post("/upload", handler.UploadEpisode(database, hlsRoot))
			r.Get("/{id}", handler.GetEpisode(database))
			r.Put("/{id}", handler.UpdateEpisode(database))
			r.Delete("/{id}", handler.DeleteEpisode(database))
		})
		r.Route("/categories", func(r chi.Router) {
			r.Get("/", handler.ListCategories(database))
			r.Post("/", handler.CreateCategory(database))
			r.Get("/{id}", handler.GetCategory(database))
			r.Put("/{id}", handler.UpdateCategory(database))
			r.Delete("/{id}", handler.DeleteCategory(database))
		})
		r.Route("/age-groups", func(r chi.Router) {
			r.Get("/", handler.ListAgeGroups(database))
			r.Post("/", handler.CreateAgeGroup(database))
			r.Get("/{id}", handler.GetAgeGroup(database))
			r.Put("/{id}", handler.UpdateAgeGroup(database))
			r.Delete("/{id}", handler.DeleteAgeGroup(database))
		})
		r.Route("/jobs", func(r chi.Router) {
			r.Get("/", handler.ListJobs(database))
			r.Get("/{id}", handler.GetJob(database))
			r.Patch("/{id}/retry", handler.RetryJob(database))
		})
		r.Get("/users", handler.ListUsers(database))
		r.Get("/youtube-meta", handler.YouTubeMeta)

		// Admin playlists
		r.Route("/playlists", func(r chi.Router) {
			r.Get("/", handler.AdminListPlaylists(database))
			r.Post("/", handler.AdminCreatePlaylist(database))
			r.Put("/{id}", handler.AdminUpdatePlaylist(database))
			r.Delete("/{id}", handler.AdminDeletePlaylist(database))
		})

		// Content reports moderation
		r.Route("/reports", func(r chi.Router) {
			r.Get("/", handler.AdminListReports(database))
			r.Get("/{id}", handler.AdminGetReport(database))
			r.Patch("/{id}", handler.AdminReviewReport(database))
		})

		// Image upload and serving
		r.Post("/images/upload", handler.UploadImage(database))
		r.Get("/images/{id}", handler.ServeImage(database))
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
