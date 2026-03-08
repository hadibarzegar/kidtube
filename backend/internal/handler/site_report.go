package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type reportContentRequest struct {
	Reason  string `json:"reason"`
	Details string `json:"details"`
}

// ReportContent returns an http.HandlerFunc that creates a content report for an episode.
// Validates reason is one of: "inappropriate", "violent", "other".
// Returns 409 if the user has already reported this episode.
// Protected endpoint — requires authentication.
func ReportContent(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid episode id", http.StatusBadRequest)
			return
		}

		var req reportContentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// Validate reason
		if req.Reason != "inappropriate" && req.Reason != "violent" && req.Reason != "other" {
			http.Error(w, "reason must be one of: inappropriate, violent, other", http.StatusBadRequest)
			return
		}

		report := models.ContentReport{
			EpisodeID:  episodeID,
			ReporterID: userID,
			Reason:     req.Reason,
			Details:    req.Details,
			Status:     "pending",
			CreatedAt:  time.Now().UTC(),
		}

		_, err = database.Collection(db.CollContentReports).InsertOne(ctx, report)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				http.Error(w, "you have already reported this episode", http.StatusConflict)
				return
			}
			http.Error(w, "failed to create report", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}
