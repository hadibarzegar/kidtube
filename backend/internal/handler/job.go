package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"github.com/hadi/kidtube/internal/worker"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// ListJobs returns an http.HandlerFunc that lists all jobs sorted by created_at descending.
// Accepts an optional ?status=xxx query parameter to filter by status.
func ListJobs(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		filter := bson.D{}

		if status := r.URL.Query().Get("status"); status != "" {
			filter = bson.D{{Key: "status", Value: status}}
		}

		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := database.Collection(db.CollJobs).Find(ctx, filter, opts)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to list jobs"}) //nolint:errcheck
			return
		}
		defer cursor.Close(ctx)

		jobs := make([]models.Job, 0)
		if err := cursor.All(ctx, &jobs); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to decode jobs"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(jobs) //nolint:errcheck
	}
}

// GetJob returns an http.HandlerFunc that retrieves a single job by ID.
func GetJob(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := chi.URLParam(r, "id")
		oid, err := bson.ObjectIDFromHex(id)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"}) //nolint:errcheck
			return
		}

		var job models.Job
		err = database.Collection(db.CollJobs).FindOne(ctx, bson.D{{Key: "_id", Value: oid}}).Decode(&job)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "job not found"}) //nolint:errcheck
			return
		}
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get job"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job) //nolint:errcheck
	}
}

// RetryJob returns an http.HandlerFunc that resets a failed job back to pending status.
func RetryJob(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := chi.URLParam(r, "id")
		oid, err := bson.ObjectIDFromHex(id)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"}) //nolint:errcheck
			return
		}

		var job models.Job
		err = database.Collection(db.CollJobs).FindOne(ctx, bson.D{{Key: "_id", Value: oid}}).Decode(&job)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "job not found"}) //nolint:errcheck
			return
		}
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get job"}) //nolint:errcheck
			return
		}

		if job.Status != models.JobStatusFailed {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "can only retry failed jobs"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "status", Value: models.JobStatusPending},
			{Key: "error", Value: ""},
			{Key: "updated_at", Value: now},
		}}}

		_, err = database.Collection(db.CollJobs).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to retry job"}) //nolint:errcheck
			return
		}

		worker.Enqueue(worker.JobRequest{
			JobID:     job.ID,
			EpisodeID: job.EpisodeID,
			SourceURL: job.SourceURL,
			Source:    job.Source,
		})

		job.Status = models.JobStatusPending
		job.Error = ""
		job.UpdatedAt = now

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job) //nolint:errcheck
	}
}
