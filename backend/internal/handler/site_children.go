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

var pinRegex = regexp.MustCompile(`^\d{4,6}$`)

type pinRequest struct {
	PIN string `json:"pin"`
}

// SetParentPIN sets or updates the parent PIN for the authenticated user.
func SetParentPIN(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req pinRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if !pinRegex.MatchString(req.PIN) {
			http.Error(w, "pin must be 4-6 digits", http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.PIN), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "failed to process pin", http.StatusInternalServerError)
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "parent_pin", Value: string(hash)},
			{Key: "updated_at", Value: now},
		}}}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to set pin", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// VerifyParentPIN verifies the parent PIN for the authenticated user.
func VerifyParentPIN(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req pinRequest
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

		if user.ParentPIN == "" {
			http.Error(w, "no pin set", http.StatusBadRequest)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.ParentPIN), []byte(req.PIN)); err != nil {
			http.Error(w, "incorrect pin", http.StatusUnauthorized)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// ListChildren returns the child profiles for the authenticated user.
func ListChildren(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		profiles := user.ChildProfiles
		if profiles == nil {
			profiles = []models.ChildProfile{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profiles) //nolint:errcheck
	}
}

type createChildRequest struct {
	Name          string `json:"name"`
	Avatar        any    `json:"avatar"` // string (legacy emoji key) or AvatarConfig object
	Age           int    `json:"age"`
	MaturityLevel string `json:"maturity_level"`
}

// CreateChild adds a new child profile to the authenticated user's account.
func CreateChild(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req createChildRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// Fetch user to check current number of children
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		if len(user.ChildProfiles) >= 5 {
			http.Error(w, "maximum of 5 child profiles allowed", http.StatusBadRequest)
			return
		}

		child := models.ChildProfile{
			ID:            bson.NewObjectID(),
			Name:          req.Name,
			Avatar:        req.Avatar,
			Age:           req.Age,
			MaturityLevel: req.MaturityLevel,
			CreatedAt:     time.Now().UTC(),
		}

		now := time.Now().UTC()
		update := bson.D{
			{Key: "$push", Value: bson.D{{Key: "child_profiles", Value: child}}},
			{Key: "$set", Value: bson.D{{Key: "updated_at", Value: now}}},
		}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to create child profile", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(child) //nolint:errcheck
	}
}

type updateChildRequest struct {
	Name                string `json:"name"`
	Avatar              any    `json:"avatar"` // string (legacy emoji key) or AvatarConfig object
	Age                 int    `json:"age"`
	MaturityLevel       string `json:"maturity_level"`
	WatchHistoryPaused  *bool  `json:"watch_history_paused"`
	SearchHistoryPaused *bool  `json:"search_history_paused"`
}

// UpdateChild updates a specific child profile for the authenticated user.
func UpdateChild(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "child_id"))
		if err != nil {
			http.Error(w, "invalid child_id", http.StatusBadRequest)
			return
		}

		var req updateChildRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		now := time.Now().UTC()
		filter := bson.D{{Key: "_id", Value: userID}}
		setFields := bson.D{
			{Key: "child_profiles.$[elem].name", Value: req.Name},
			{Key: "child_profiles.$[elem].avatar", Value: req.Avatar},
			{Key: "child_profiles.$[elem].age", Value: req.Age},
			{Key: "child_profiles.$[elem].maturity_level", Value: req.MaturityLevel},
			{Key: "updated_at", Value: now},
		}
		if req.WatchHistoryPaused != nil {
			setFields = append(setFields, bson.E{Key: "child_profiles.$[elem].watch_history_paused", Value: *req.WatchHistoryPaused})
		}
		if req.SearchHistoryPaused != nil {
			setFields = append(setFields, bson.E{Key: "child_profiles.$[elem].search_history_paused", Value: *req.SearchHistoryPaused})
		}
		update := bson.D{{Key: "$set", Value: setFields}}

		opts := options.UpdateOne().SetArrayFilters([]any{bson.D{{Key: "elem._id", Value: childID}}})

		result, err := database.Collection(db.CollUsers).UpdateOne(
			r.Context(),
			filter,
			update,
			opts,
		)
		if err != nil {
			http.Error(w, "failed to update child profile", http.StatusInternalServerError)
			return
		}

		if result.MatchedCount == 0 {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// DeleteChild removes a child profile from the authenticated user's account.
func DeleteChild(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "child_id"))
		if err != nil {
			http.Error(w, "invalid child_id", http.StatusBadRequest)
			return
		}

		now := time.Now().UTC()

		// Remove the child from child_profiles and clear active_child_id if it matches
		update := bson.D{
			{Key: "$pull", Value: bson.D{{Key: "child_profiles", Value: bson.D{{Key: "_id", Value: childID}}}}},
			{Key: "$set", Value: bson.D{{Key: "updated_at", Value: now}}},
		}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to delete child profile", http.StatusInternalServerError)
			return
		}

		// Clear active_child_id if it matches the deleted child
		clearActive := bson.D{{Key: "$unset", Value: bson.D{{Key: "active_child_id", Value: ""}}}}
		_, _ = database.Collection(db.CollUsers).UpdateOne(
			r.Context(),
			bson.D{{Key: "_id", Value: userID}, {Key: "active_child_id", Value: childID}},
			clearActive,
		)

		w.WriteHeader(http.StatusOK)
	}
}

// ActivateChild sets the active child profile for the authenticated user.
func ActivateChild(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "child_id"))
		if err != nil {
			http.Error(w, "invalid child_id", http.StatusBadRequest)
			return
		}

		// Validate child exists in user's profiles
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		found := false
		for _, cp := range user.ChildProfiles {
			if cp.ID == childID {
				found = true
				break
			}
		}
		if !found {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "active_child_id", Value: childID},
			{Key: "updated_at", Value: now},
		}}}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to activate child profile", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// DeactivateChild clears the active child profile after verifying the parent PIN.
func DeactivateChild(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req pinRequest
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

		if user.ParentPIN == "" {
			http.Error(w, "no pin set", http.StatusBadRequest)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.ParentPIN), []byte(req.PIN)); err != nil {
			http.Error(w, "incorrect pin", http.StatusUnauthorized)
			return
		}

		now := time.Now().UTC()
		update := bson.D{
			{Key: "$unset", Value: bson.D{{Key: "active_child_id", Value: ""}}},
			{Key: "$set", Value: bson.D{{Key: "updated_at", Value: now}}},
		}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to deactivate child profile", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
