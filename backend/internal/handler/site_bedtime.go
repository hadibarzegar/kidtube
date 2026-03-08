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

type setBedtimeRequest struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Timezone  string `json:"timezone"`
	Enabled   bool   `json:"enabled"`
}

type bedtimeResponse struct {
	models.BedtimeRule `json:",inline"`
	IsBedtime          bool `json:"is_bedtime"`
}

// checkBedtime determines whether the current time falls within the bedtime window.
// Handles overnight windows (e.g. 21:00–07:00 that cross midnight).
func checkBedtime(startTime, endTime, timezone string) bool {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return false
	}

	now := time.Now().In(loc)
	nowMinutes := now.Hour()*60 + now.Minute()

	startH, startM := parseTime24(startTime)
	endH, endM := parseTime24(endTime)
	startMinutes := startH*60 + startM
	endMinutes := endH*60 + endM

	if startMinutes <= endMinutes {
		// Same-day window (e.g. 13:00–15:00)
		return nowMinutes >= startMinutes && nowMinutes < endMinutes
	}
	// Overnight window (e.g. 21:00–07:00)
	return nowMinutes >= startMinutes || nowMinutes < endMinutes
}

// parseTime24 parses a "HH:MM" string into hours and minutes.
func parseTime24(t string) (int, int) {
	parsed, err := time.Parse("15:04", t)
	if err != nil {
		return 0, 0
	}
	return parsed.Hour(), parsed.Minute()
}

// SetBedtime upserts a bedtime rule for the given child profile.
func SetBedtime(database *mongo.Database) http.HandlerFunc {
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

		var req setBedtimeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// Default timezone
		if req.Timezone == "" {
			req.Timezone = "Asia/Tehran"
		}

		// Validate timezone
		if _, err := time.LoadLocation(req.Timezone); err != nil {
			http.Error(w, "invalid timezone", http.StatusBadRequest)
			return
		}

		// Validate child belongs to user
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		if !childBelongsToUser(&user, childID) {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		now := time.Now().UTC()
		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		}
		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "start_time", Value: req.StartTime},
				{Key: "end_time", Value: req.EndTime},
				{Key: "timezone", Value: req.Timezone},
				{Key: "enabled", Value: req.Enabled},
				{Key: "updated_at", Value: now},
			}},
			{Key: "$setOnInsert", Value: bson.D{
				{Key: "user_id", Value: userID},
				{Key: "child_id", Value: childID},
				{Key: "created_at", Value: now},
			}},
		}

		opts := options.UpdateOne().SetUpsert(true)
		_, err = database.Collection(db.CollBedtimeRules).UpdateOne(r.Context(), filter, update, opts)
		if err != nil {
			http.Error(w, "failed to set bedtime rule", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// GetBedtime returns the current bedtime rule for the given child profile.
func GetBedtime(database *mongo.Database) http.HandlerFunc {
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

		// Validate child belongs to user
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		if !childBelongsToUser(&user, childID) {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		var rule models.BedtimeRule
		err = database.Collection(db.CollBedtimeRules).FindOne(r.Context(), bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		}).Decode(&rule)

		if err != nil {
			// No rule found — return defaults
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{ //nolint:errcheck
				"enabled":    false,
				"is_bedtime": false,
			})
			return
		}

		isBedtime := false
		if rule.Enabled {
			isBedtime = checkBedtime(rule.StartTime, rule.EndTime, rule.Timezone)
		}

		resp := bedtimeResponse{
			BedtimeRule: rule,
			IsBedtime:   isBedtime,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	}
}

// DeleteBedtime removes the bedtime rule for the given child profile.
func DeleteBedtime(database *mongo.Database) http.HandlerFunc {
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

		// Validate child belongs to user
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		if !childBelongsToUser(&user, childID) {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		_, err = database.Collection(db.CollBedtimeRules).DeleteOne(r.Context(), bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		})
		if err != nil {
			http.Error(w, "failed to delete bedtime rule", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
