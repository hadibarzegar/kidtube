package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// AgeGroup represents an admin-defined age range for content filtering.
// Age groups are stored as documents and not hardcoded enums, allowing admins to add custom ranges.
type AgeGroup struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string        `bson:"name" json:"name"`
	MinAge    int           `bson:"min_age" json:"min_age"`
	MaxAge    int           `bson:"max_age" json:"max_age"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updated_at"`
}
