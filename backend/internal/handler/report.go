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
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// AdminListReports returns an http.HandlerFunc that lists all content reports.
// Supports optional ?status= query filter. Sorted by created_at descending.
func AdminListReports(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		filter := bson.D{}

		if status := r.URL.Query().Get("status"); status != "" {
			filter = append(filter, bson.E{Key: "status", Value: status})
		}

		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := database.Collection(db.CollContentReports).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch reports", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		reports := make([]models.ContentReport, 0)
		if err := cursor.All(ctx, &reports); err != nil {
			http.Error(w, "failed to decode reports", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reports) //nolint:errcheck
	}
}

// adminReportResponse embeds a ContentReport with its associated Episode for display.
type adminReportResponse struct {
	models.ContentReport `json:",inline"`
	Episode              *models.Episode `json:"episode,omitempty"`
}

// AdminGetReport returns an http.HandlerFunc that retrieves a single content report by ID.
// Also fetches the associated episode for display.
func AdminGetReport(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		oid, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var report models.ContentReport
		err = database.Collection(db.CollContentReports).FindOne(ctx, bson.D{
			{Key: "_id", Value: oid},
		}).Decode(&report)
		if err == mongo.ErrNoDocuments {
			http.Error(w, "report not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "failed to fetch report", http.StatusInternalServerError)
			return
		}

		// Fetch associated episode
		var episode models.Episode
		resp := adminReportResponse{ContentReport: report}
		err = database.Collection(db.CollEpisodes).FindOne(ctx, bson.D{
			{Key: "_id", Value: report.EpisodeID},
		}).Decode(&episode)
		if err == nil {
			resp.Episode = &episode
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	}
}

type adminReviewReportRequest struct {
	Status string `json:"status"`
}

// AdminReviewReport returns an http.HandlerFunc that updates a content report's status.
// Accepts status "reviewed" or "dismissed". Sets reviewed_by from JWT and reviewed_at to now.
func AdminReviewReport(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		oid, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var req adminReviewReportRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.Status != "reviewed" && req.Status != "dismissed" {
			http.Error(w, "status must be one of: reviewed, dismissed", http.StatusBadRequest)
			return
		}

		reviewerID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "status", Value: req.Status},
			{Key: "reviewed_by", Value: reviewerID},
			{Key: "reviewed_at", Value: now},
		}}}

		result, err := database.Collection(db.CollContentReports).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
		if err != nil {
			http.Error(w, "failed to update report", http.StatusInternalServerError)
			return
		}
		if result.MatchedCount == 0 {
			http.Error(w, "report not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
