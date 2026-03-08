package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// ListNotifications returns an http.HandlerFunc that lists the authenticated user's notifications.
// Sorted with unread first, then by created_at descending. Limited to 50.
// Protected endpoint — requires authentication.
func ListNotifications(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		filter := bson.D{{Key: "user_id", Value: userID}}
		opts := options.Find().
			SetSort(bson.D{
				{Key: "read", Value: 1},
				{Key: "created_at", Value: -1},
			}).
			SetLimit(50)

		cursor, err := database.Collection(db.CollNotifications).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch notifications", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		notifications := make([]models.Notification, 0)
		if err := cursor.All(ctx, &notifications); err != nil {
			http.Error(w, "failed to decode notifications", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(notifications) //nolint:errcheck
	}
}

// MarkAllNotificationsRead returns an http.HandlerFunc that marks all of the
// authenticated user's unread notifications as read.
// Protected endpoint — requires authentication.
func MarkAllNotificationsRead(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "read", Value: false},
		}
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "read", Value: true},
		}}}

		_, err = database.Collection(db.CollNotifications).UpdateMany(ctx, filter, update)
		if err != nil {
			http.Error(w, "failed to mark notifications as read", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// UnreadNotificationCount returns an http.HandlerFunc that returns the count of
// unread notifications for the authenticated user.
// Protected endpoint — requires authentication.
func UnreadNotificationCount(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "read", Value: false},
		}

		count, err := database.Collection(db.CollNotifications).CountDocuments(ctx, filter)
		if err != nil {
			http.Error(w, "failed to count notifications", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int64{"count": count}) //nolint:errcheck
	}
}
