package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Channel represents a curated collection of episodes for a specific topic or show.
type Channel struct {
	ID          bson.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name        string          `bson:"name" json:"name"`
	Description string          `bson:"description" json:"description"`
	Thumbnail   string          `bson:"thumbnail" json:"thumbnail"`
	CategoryIDs []bson.ObjectID `bson:"category_ids" json:"category_ids"`
	AgeGroupIDs []bson.ObjectID `bson:"age_group_ids" json:"age_group_ids"`
	CreatedAt   time.Time       `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time       `bson:"updated_at" json:"updated_at"`
}
