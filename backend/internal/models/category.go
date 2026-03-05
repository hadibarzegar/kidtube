package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Category represents a content category used to classify channels.
type Category struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string        `bson:"name" json:"name"`
	Thumbnail string        `bson:"thumbnail" json:"thumbnail"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updated_at"`
}
