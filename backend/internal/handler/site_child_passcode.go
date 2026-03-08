package handler

import (
	"encoding/json"
	"net/http"
	"regexp"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var passcodeRegex = regexp.MustCompile(`^\d{4}$`)

type passcodeRequest struct {
	Passcode string `json:"passcode"`
}

// SetChildPasscode sets or updates the passcode for a child profile.
func SetChildPasscode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "childId"))
		if err != nil {
			http.Error(w, "invalid childId", http.StatusBadRequest)
			return
		}

		var req passcodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if !passcodeRegex.MatchString(req.Passcode) {
			http.Error(w, "passcode must be 4 digits", http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Passcode), 10)
		if err != nil {
			http.Error(w, "failed to process passcode", http.StatusInternalServerError)
			return
		}

		now := time.Now().UTC()
		filter := bson.D{{Key: "_id", Value: userID}}
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "child_profiles.$[elem].passcode", Value: string(hash)},
			{Key: "child_profiles.$[elem].has_passcode", Value: true},
			{Key: "updated_at", Value: now},
		}}}

		opts := options.UpdateOne().SetArrayFilters([]any{bson.D{{Key: "elem._id", Value: childID}}})

		result, err := database.Collection(db.CollUsers).UpdateOne(r.Context(), filter, update, opts)
		if err != nil {
			http.Error(w, "failed to set passcode", http.StatusInternalServerError)
			return
		}

		if result.MatchedCount == 0 {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// VerifyChildPasscode verifies the passcode for a child profile.
func VerifyChildPasscode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "childId"))
		if err != nil {
			http.Error(w, "invalid childId", http.StatusBadRequest)
			return
		}

		var req passcodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		var child *models.ChildProfile
		for i := range user.ChildProfiles {
			if user.ChildProfiles[i].ID == childID {
				child = &user.ChildProfiles[i]
				break
			}
		}

		if child == nil {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		if child.Passcode == "" {
			http.Error(w, "no passcode set", http.StatusBadRequest)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(child.Passcode), []byte(req.Passcode)); err != nil {
			http.Error(w, "incorrect passcode", http.StatusUnauthorized)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// RemoveChildPasscode removes the passcode from a child profile.
func RemoveChildPasscode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "childId"))
		if err != nil {
			http.Error(w, "invalid childId", http.StatusBadRequest)
			return
		}

		now := time.Now().UTC()
		filter := bson.D{{Key: "_id", Value: userID}}
		update := bson.D{
			{Key: "$unset", Value: bson.D{
				{Key: "child_profiles.$[elem].passcode", Value: ""},
			}},
			{Key: "$set", Value: bson.D{
				{Key: "child_profiles.$[elem].has_passcode", Value: false},
				{Key: "updated_at", Value: now},
			}},
		}

		opts := options.UpdateOne().SetArrayFilters([]any{bson.D{{Key: "elem._id", Value: childID}}})

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), filter, update, opts)
		if err != nil {
			http.Error(w, "failed to remove passcode", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
