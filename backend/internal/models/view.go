package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// View represents a single recorded view of an episode.
// ViewerID is a string: the user's ObjectID hex if logged in, or "ip:<addr>" for guests.
type View struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	EpisodeID bson.ObjectID `bson:"episode_id" json:"episode_id"`
	ViewerID  string        `bson:"viewer_id" json:"viewer_id"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
