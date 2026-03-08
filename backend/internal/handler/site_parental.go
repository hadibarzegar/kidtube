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

// childBelongsToUser checks that the given childID exists in the user's child profiles.
func childBelongsToUser(user *models.User, childID bson.ObjectID) bool {
	for _, cp := range user.ChildProfiles {
		if cp.ID == childID {
			return true
		}
	}
	return false
}

// childProfileByID returns the child profile matching the given ID, or nil if not found.
func childProfileByID(user *models.User, childID bson.ObjectID) *models.ChildProfile {
	for i := range user.ChildProfiles {
		if user.ChildProfiles[i].ID == childID {
			return &user.ChildProfiles[i]
		}
	}
	return nil
}

type reportScreenTimeRequest struct {
	Minutes int `json:"minutes"`
}

// ReportScreenTime upserts a screen time heartbeat for the given child profile.
func ReportScreenTime(database *mongo.Database) http.HandlerFunc {
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

		var req reportScreenTimeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
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

		today := time.Now().UTC().Format("2006-01-02")
		now := time.Now().UTC()

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
			{Key: "date", Value: today},
		}
		update := bson.D{
			{Key: "$inc", Value: bson.D{{Key: "minutes", Value: req.Minutes}}},
			{Key: "$set", Value: bson.D{{Key: "updated_at", Value: now}}},
			{Key: "$setOnInsert", Value: bson.D{
				{Key: "user_id", Value: userID},
				{Key: "child_id", Value: childID},
				{Key: "date", Value: today},
			}},
		}

		opts := options.UpdateOne().SetUpsert(true)
		_, err = database.Collection(db.CollScreenTimeLogs).UpdateOne(r.Context(), filter, update, opts)
		if err != nil {
			http.Error(w, "failed to report screen time", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

type screenTimeResponse struct {
	UsedMinutes  int `json:"used_minutes"`
	LimitMinutes int `json:"limit_minutes"`
}

// GetScreenTime returns today's screen time usage and limit for the given child profile.
func GetScreenTime(database *mongo.Database) http.HandlerFunc {
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

		// Fetch user and validate child
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		child := childProfileByID(&user, childID)
		if child == nil {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		today := time.Now().UTC().Format("2006-01-02")

		var log models.ScreenTimeLog
		err = database.Collection(db.CollScreenTimeLogs).FindOne(r.Context(), bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
			{Key: "date", Value: today},
		}).Decode(&log)

		usedMinutes := 0
		if err == nil {
			usedMinutes = log.Minutes
		}

		resp := screenTimeResponse{
			UsedMinutes:  usedMinutes,
			LimitMinutes: child.ScreenTimeLimitMin,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	}
}

type activityEntry struct {
	models.ViewingActivity `json:",inline"`
	EpisodeTitle           string `json:"episode_title"`
	EpisodeThumbnail       string `json:"episode_thumbnail"`
}

// GetViewingActivity returns the viewing activity for the given child profile.
func GetViewingActivity(database *mongo.Database) http.HandlerFunc {
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

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		}

		// Apply optional date range filters
		from := r.URL.Query().Get("from")
		to := r.URL.Query().Get("to")
		if from != "" || to != "" {
			dateFilter := bson.D{}
			if from != "" {
				fromTime, err := time.Parse("2006-01-02", from)
				if err == nil {
					dateFilter = append(dateFilter, bson.E{Key: "$gte", Value: fromTime})
				}
			}
			if to != "" {
				toTime, err := time.Parse("2006-01-02", to)
				if err == nil {
					// Include the entire "to" day
					toTime = toTime.Add(24*time.Hour - time.Nanosecond)
					dateFilter = append(dateFilter, bson.E{Key: "$lte", Value: toTime})
				}
			}
			if len(dateFilter) > 0 {
				filter = append(filter, bson.E{Key: "watched_at", Value: dateFilter})
			}
		}

		opts := options.Find().SetSort(bson.D{{Key: "watched_at", Value: -1}})
		cursor, err := database.Collection(db.CollViewingActivity).Find(r.Context(), filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch viewing activity", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var activities []models.ViewingActivity
		if err := cursor.All(r.Context(), &activities); err != nil {
			http.Error(w, "failed to decode viewing activity", http.StatusInternalServerError)
			return
		}

		entries := make([]activityEntry, 0, len(activities))
		for _, a := range activities {
			entry := activityEntry{ViewingActivity: a}
			var ep models.Episode
			err := database.Collection(db.CollEpisodes).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: a.EpisodeID}},
			).Decode(&ep)
			if err == nil {
				entry.EpisodeTitle = ep.Title
				entry.EpisodeThumbnail = ep.Thumbnail
			}
			entries = append(entries, entry)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(entries) //nolint:errcheck
	}
}

type setChannelRuleRequest struct {
	ChannelID string `json:"channel_id"`
	Action    string `json:"action"`
}

// SetChannelRule creates a channel rule (allow/block) for the given child profile.
func SetChannelRule(database *mongo.Database) http.HandlerFunc {
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

		var req setChannelRuleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.Action != "allow" && req.Action != "block" {
			http.Error(w, "action must be 'allow' or 'block'", http.StatusBadRequest)
			return
		}

		channelID, err := bson.ObjectIDFromHex(req.ChannelID)
		if err != nil {
			http.Error(w, "invalid channel_id", http.StatusBadRequest)
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

		rule := models.ChannelRule{
			UserID:    userID,
			ChildID:   childID,
			ChannelID: channelID,
			Action:    req.Action,
			CreatedAt: time.Now().UTC(),
		}

		_, err = database.Collection(db.CollChannelRules).InsertOne(r.Context(), rule)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				http.Error(w, "rule already exists for this channel", http.StatusConflict)
				return
			}
			http.Error(w, "failed to create channel rule", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

type channelRuleEntry struct {
	models.ChannelRule `json:",inline"`
	ChannelName        string `json:"channel_name"`
	ChannelThumbnail   string `json:"channel_thumbnail"`
}

// ListChannelRules returns all channel rules for the given child profile.
func ListChannelRules(database *mongo.Database) http.HandlerFunc {
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

		cursor, err := database.Collection(db.CollChannelRules).Find(r.Context(), bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		})
		if err != nil {
			http.Error(w, "failed to fetch channel rules", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var rules []models.ChannelRule
		if err := cursor.All(r.Context(), &rules); err != nil {
			http.Error(w, "failed to decode channel rules", http.StatusInternalServerError)
			return
		}

		entries := make([]channelRuleEntry, 0, len(rules))
		for _, rule := range rules {
			entry := channelRuleEntry{ChannelRule: rule}
			var ch models.Channel
			err := database.Collection(db.CollChannels).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: rule.ChannelID}},
			).Decode(&ch)
			if err == nil {
				entry.ChannelName = ch.Name
				entry.ChannelThumbnail = ch.Thumbnail
			}
			entries = append(entries, entry)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(entries) //nolint:errcheck
	}
}

// DeleteChannelRule removes a channel rule by ID for the authenticated user.
func DeleteChannelRule(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		ruleID, err := bson.ObjectIDFromHex(chi.URLParam(r, "rule_id"))
		if err != nil {
			http.Error(w, "invalid rule_id", http.StatusBadRequest)
			return
		}

		_, err = database.Collection(db.CollChannelRules).DeleteOne(
			r.Context(),
			bson.D{{Key: "_id", Value: ruleID}, {Key: "user_id", Value: userID}},
		)
		if err != nil {
			http.Error(w, "failed to delete channel rule", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
