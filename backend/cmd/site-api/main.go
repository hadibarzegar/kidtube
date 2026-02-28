package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/hadi/kidtube/internal/db"
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
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
			log.Printf("site-api: failed to encode health response: %v", err)
		}
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
