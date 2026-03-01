package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/jwtauth/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// userIDFromContext extracts the user_id from JWT claims in the request context.
func userIDFromContext(r *http.Request) (bson.ObjectID, error) {
	_, claims, _ := jwtauth.FromContext(r.Context())
	userIDStr, _ := claims["user_id"].(string)
	return bson.ObjectIDFromHex(userIDStr)
}

// GetMe returns an http.HandlerFunc that returns the authenticated user's profile.
// Excludes password_hash from the response via projection.
func GetMe(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var user models.User
		projection := options.FindOne().SetProjection(bson.D{
			{Key: "password_hash", Value: 0},
		})
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, projection).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user) //nolint:errcheck
	}
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// ChangePassword returns an http.HandlerFunc that updates the authenticated user's password.
func ChangePassword(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req changePasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if len(req.NewPassword) < 8 {
			http.Error(w, "new password must be at least 8 characters", http.StatusBadRequest)
			return
		}

		// Fetch user including password_hash for comparison
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
			http.Error(w, "current password is incorrect", http.StatusUnauthorized)
			return
		}

		newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "failed to process password", http.StatusInternalServerError)
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "password_hash", Value: string(newHash)},
			{Key: "updated_at", Value: now},
		}}}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to update password", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
