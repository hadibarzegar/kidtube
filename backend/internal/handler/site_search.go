package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"sync"

	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// SiteSearch returns an http.HandlerFunc that performs a case-insensitive text search
// across channels (by name) and episodes (by title, status=ready only) in parallel.
func SiteSearch(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		q := strings.TrimSpace(r.URL.Query().Get("q"))

		w.Header().Set("Content-Type", "application/json")

		if q == "" {
			json.NewEncoder(w).Encode(map[string]any{ //nolint:errcheck
				"channels": []models.Channel{},
				"episodes": []models.Episode{},
			})
			return
		}

		// Build case-insensitive regex using QuoteMeta to safely escape user input.
		regexPattern := bson.Regex{Pattern: regexp.QuoteMeta(q), Options: "i"}

		var (
			channels []models.Channel
			episodes []models.Episode
			wg       sync.WaitGroup
		)
		channels = make([]models.Channel, 0)
		episodes = make([]models.Episode, 0)

		wg.Add(2)

		// Query channels by name in a goroutine.
		go func() {
			defer wg.Done()
			cursor, err := database.Collection(db.CollChannels).Find(ctx, bson.D{
				{Key: "name", Value: bson.D{{Key: "$regex", Value: regexPattern}}},
			})
			if err != nil {
				log.Printf("site search: channels query error: %v", err)
				return
			}
			defer cursor.Close(ctx)
			if err := cursor.All(ctx, &channels); err != nil {
				log.Printf("site search: channels decode error: %v", err)
			}
		}()

		// Query episodes by title in a goroutine — only status=ready.
		go func() {
			defer wg.Done()
			cursor, err := database.Collection(db.CollEpisodes).Find(ctx, bson.D{
				{Key: "title", Value: bson.D{{Key: "$regex", Value: regexPattern}}},
				{Key: "status", Value: "ready"},
			})
			if err != nil {
				log.Printf("site search: episodes query error: %v", err)
				return
			}
			defer cursor.Close(ctx)
			if err := cursor.All(ctx, &episodes); err != nil {
				log.Printf("site search: episodes decode error: %v", err)
			}
		}()

		wg.Wait()

		json.NewEncoder(w).Encode(map[string]any{ //nolint:errcheck
			"channels": channels,
			"episodes": episodes,
		})
	}
}
