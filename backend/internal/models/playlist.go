package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Playlist represents a user-created or admin-curated collection of episodes.
type Playlist struct {
	ID          bson.ObjectID   `bson:"_id,omitempty" json:"id"`
	UserID      bson.ObjectID   `bson:"user_id" json:"user_id"`
	ChildID     *bson.ObjectID  `bson:"child_id,omitempty" json:"child_id,omitempty"`
	Title       string          `bson:"title" json:"title"`
	Description string          `bson:"description,omitempty" json:"description,omitempty"`
	EpisodeIDs  []bson.ObjectID `bson:"episode_ids" json:"episode_ids"`
	IsPublic    bool            `bson:"is_public" json:"is_public"`
	IsFeatured  bool            `bson:"is_featured" json:"is_featured"`
	Thumbnail   string          `bson:"thumbnail,omitempty" json:"thumbnail,omitempty"`
	CreatedAt   time.Time       `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time       `bson:"updated_at" json:"updated_at"`
}
