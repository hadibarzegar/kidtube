package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// GetBadges returns all achievements for the given child profile.
func GetBadges(database *mongo.Database) http.HandlerFunc {
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

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		}

		opts := options.Find().SetSort(bson.D{{Key: "earned_at", Value: -1}})
		cursor, err := database.Collection(db.CollAchievements).Find(r.Context(), filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch badges", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var achievements []models.Achievement
		if err := cursor.All(r.Context(), &achievements); err != nil {
			http.Error(w, "failed to decode badges", http.StatusInternalServerError)
			return
		}

		if achievements == nil {
			achievements = []models.Achievement{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(achievements) //nolint:errcheck
	}
}

// GetStreak returns the streak info for the given child profile.
func GetStreak(database *mongo.Database) http.HandlerFunc {
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

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
		}

		var streak models.Streak
		err = database.Collection(db.CollStreaks).FindOne(r.Context(), filter).Decode(&streak)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"current_streak": 0, "longest_streak": 0}) //nolint:errcheck
			return
		}
		if err != nil {
			http.Error(w, "failed to fetch streak", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(streak) //nolint:errcheck
	}
}

// CheckAndAwardBadges checks badge criteria and awards any newly earned badges.
// This is not an HTTP handler — it is called as a goroutine after watch progress updates.
func CheckAndAwardBadges(database *mongo.Database, userID, childID bson.ObjectID) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	now := time.Now().UTC()

	// Count completed watch progress entries for this child
	completedCount, err := database.Collection(db.CollWatchProgress).CountDocuments(ctx, bson.D{
		{Key: "user_id", Value: userID},
		{Key: "child_id", Value: childID},
		{Key: "completed", Value: true},
	})
	if err != nil {
		log.Printf("gamification: failed to count completed episodes: %v", err)
		return
	}

	// Award watch-count badges
	watchBadges := []struct {
		threshold int64
		badge     string
	}{
		{1, "first_video"},
		{10, "watched_10"},
		{50, "watched_50"},
		{100, "watched_100"},
	}

	for _, wb := range watchBadges {
		if completedCount >= wb.threshold {
			_, err := database.Collection(db.CollAchievements).InsertOne(ctx, models.Achievement{
				UserID:    userID,
				ChildID:   childID,
				BadgeType: wb.badge,
				EarnedAt:  now,
			})
			if err != nil && !mongo.IsDuplicateKeyError(err) {
				log.Printf("gamification: failed to award badge %s: %v", wb.badge, err)
			}
		}
	}

	// Count distinct categories watched via episodes → channels → categories lookup
	// Step 1: Get distinct episode IDs from completed watch progress
	var episodeIDs []bson.ObjectID
	err = database.Collection(db.CollWatchProgress).Distinct(ctx, "episode_id", bson.D{
		{Key: "user_id", Value: userID},
		{Key: "child_id", Value: childID},
		{Key: "completed", Value: true},
	}).Decode(&episodeIDs)
	if err != nil {
		log.Printf("gamification: failed to get distinct episodes: %v", err)
		return
	}

	if len(episodeIDs) > 0 {
		// Step 2: Get distinct channel IDs from those episodes
		var channelIDs []bson.ObjectID
		err = database.Collection(db.CollEpisodes).Distinct(ctx, "channel_id", bson.D{
			{Key: "_id", Value: bson.D{{Key: "$in", Value: episodeIDs}}},
		}).Decode(&channelIDs)
		if err != nil {
			log.Printf("gamification: failed to get distinct channels: %v", err)
			return
		}

		if len(channelIDs) > 0 {
			// Step 3: Get distinct category IDs from those channels
			var categoryIDs []bson.ObjectID
			err = database.Collection(db.CollChannels).Distinct(ctx, "category_ids", bson.D{
				{Key: "_id", Value: bson.D{{Key: "$in", Value: channelIDs}}},
			}).Decode(&categoryIDs)
			if err != nil {
				log.Printf("gamification: failed to get distinct categories: %v", err)
				return
			}

			if len(categoryIDs) >= 5 {
				_, err := database.Collection(db.CollAchievements).InsertOne(ctx, models.Achievement{
					UserID:    userID,
					ChildID:   childID,
					BadgeType: "explorer",
					EarnedAt:  now,
				})
				if err != nil && !mongo.IsDuplicateKeyError(err) {
					log.Printf("gamification: failed to award explorer badge: %v", err)
				}
			}
		}
	}

	// Check streak badges
	var streak models.Streak
	err = database.Collection(db.CollStreaks).FindOne(ctx, bson.D{
		{Key: "user_id", Value: userID},
		{Key: "child_id", Value: childID},
	}).Decode(&streak)
	if err != nil {
		return // no streak yet, nothing to check
	}

	streakBadges := []struct {
		threshold int
		badge     string
	}{
		{3, "streak_3"},
		{7, "streak_7"},
		{30, "streak_30"},
	}

	for _, sb := range streakBadges {
		if streak.CurrentStreak >= sb.threshold {
			_, err := database.Collection(db.CollAchievements).InsertOne(ctx, models.Achievement{
				UserID:    userID,
				ChildID:   childID,
				BadgeType: sb.badge,
				EarnedAt:  now,
			})
			if err != nil && !mongo.IsDuplicateKeyError(err) {
				log.Printf("gamification: failed to award streak badge %s: %v", sb.badge, err)
			}
		}
	}
}

// UpdateStreak updates the daily watch streak for the given child profile.
// This is not an HTTP handler — it is called as a goroutine after watch progress updates.
func UpdateStreak(database *mongo.Database, userID, childID bson.ObjectID) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		log.Printf("gamification: failed to load timezone: %v", err)
		return
	}

	today := time.Now().In(loc).Format("2006-01-02")
	yesterday := time.Now().In(loc).AddDate(0, 0, -1).Format("2006-01-02")

	filter := bson.D{
		{Key: "user_id", Value: userID},
		{Key: "child_id", Value: childID},
	}

	var streak models.Streak
	err = database.Collection(db.CollStreaks).FindOne(ctx, filter).Decode(&streak)
	if err == mongo.ErrNoDocuments {
		// Create new streak
		_, err = database.Collection(db.CollStreaks).InsertOne(ctx, models.Streak{
			UserID:        userID,
			ChildID:       childID,
			CurrentStreak: 1,
			LongestStreak: 1,
			LastWatchDate: today,
		})
		if err != nil && !mongo.IsDuplicateKeyError(err) {
			log.Printf("gamification: failed to create streak: %v", err)
		}
		return
	}
	if err != nil {
		log.Printf("gamification: failed to fetch streak: %v", err)
		return
	}

	// Already watched today — no-op
	if streak.LastWatchDate == today {
		return
	}

	newCurrent := 1
	if streak.LastWatchDate == yesterday {
		newCurrent = streak.CurrentStreak + 1
	}

	newLongest := streak.LongestStreak
	if newCurrent > newLongest {
		newLongest = newCurrent
	}

	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "current_streak", Value: newCurrent},
			{Key: "longest_streak", Value: newLongest},
			{Key: "last_watch_date", Value: today},
		}},
	}

	opts := options.UpdateOne().SetUpsert(true)
	_, err = database.Collection(db.CollStreaks).UpdateOne(ctx, filter, update, opts)
	if err != nil {
		log.Printf("gamification: failed to update streak: %v", err)
	}
}
