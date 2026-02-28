package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// User represents an application user — either a regular viewer or an admin.
type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Email        string        `bson:"email" json:"email"`
	PasswordHash string        `bson:"password_hash" json:"-"`
	Role         string        `bson:"role" json:"role"` // "user" or "admin"
	CreatedAt    time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time     `bson:"updated_at" json:"updated_at"`
}
