package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

type healthResponse struct {
	Status string `json:"status"`
	DB     string `json:"db"`
	Time   string `json:"time"`
}

// HealthHandler returns an http.HandlerFunc that checks MongoDB connectivity.
// It accepts a *mongo.Database to ping on each request.
func HealthHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		resp := healthResponse{
			Status: "ok",
			DB:     "ok",
			Time:   time.Now().UTC().Format(time.RFC3339),
		}

		if err := db.Client().Ping(ctx, nil); err != nil {
			resp.Status = "degraded"
			resp.DB = "unreachable"
			w.WriteHeader(http.StatusServiceUnavailable)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	}
}
