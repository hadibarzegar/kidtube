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
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
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
		log.Fatalf("site-api: failed to connect to MongoDB: %v", err)
	}

	if err := db.EnsureIndexes(context.Background(), database); err != nil {
		log.Fatalf("site-api: failed to ensure indexes: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", handler.HealthHandler(database))

	// Public routes — no authentication required (AUTH-04).
	r.Get("/channels", handler.SiteListChannels(database))
	r.Get("/channels/{id}", handler.SiteGetChannel(database))
	r.Get("/episodes", handler.SiteListEpisodes(database))
	r.Get("/episodes/{id}", handler.SiteGetEpisode(database))
	r.Get("/categories", handler.SiteListCategories(database))
	r.Get("/age-groups", handler.SiteListAgeGroups(database))
	r.Get("/search", handler.SiteSearch(database))

	// Public auth routes — no JWT required
	r.Post("/auth/register", handler.SiteRegister(database))
	r.Post("/auth/login", handler.SiteLogin(database))

	// tokenFromSiteCookie reads the site_token cookie for browser-based auth.
	tokenFromSiteCookie := func(r *http.Request) string {
		cookie, err := r.Cookie("site_token")
		if err != nil {
			return ""
		}
		return cookie.Value
	}

	// Protected routes — require valid site JWT
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromSiteCookie))
		r.Use(jwtauth.Authenticator(auth.TokenAuth))

		r.Get("/me", handler.GetMe(database))
		r.Put("/me/password", handler.ChangePassword(database))
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("site-api listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("site-api: server error: %v", err)
		}
	}()

	<-done
	log.Println("site-api: shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("site-api: graceful shutdown failed: %v", err)
	}
	log.Println("site-api: stopped")
}
