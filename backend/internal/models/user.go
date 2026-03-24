package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ChildProfile represents a child's profile embedded within a parent user account.
type ChildProfile struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name          string        `bson:"name" json:"name"`
	Avatar        any           `bson:"avatar" json:"avatar"`                 // string (legacy emoji key) or AvatarConfig object
	Age           int           `bson:"age" json:"age"`                       // child's age
	MaturityLevel      string        `bson:"maturity_level" json:"maturity_level"` // "all-ages", "6+", "9+", "12+"
	ScreenTimeLimitMin int           `bson:"screen_time_limit_min" json:"screen_time_limit_min"`
	SearchDisabled     bool          `bson:"search_disabled" json:"search_disabled"`
	AutoplayDisabled    bool          `bson:"autoplay_disabled" json:"autoplay_disabled"`
	WatchHistoryPaused  bool          `bson:"watch_history_paused" json:"watch_history_paused"`
	SearchHistoryPaused bool          `bson:"search_history_paused" json:"search_history_paused"`
	Passcode            string        `bson:"passcode,omitempty" json:"-"`
	HasPasscode         bool          `bson:"has_passcode" json:"has_passcode"`
	CreatedAt           time.Time     `bson:"created_at" json:"created_at"`
}

// User represents an application user — either a regular viewer or an admin.
type User struct {
	ID            bson.ObjectID   `bson:"_id,omitempty" json:"id"`
	Email         string          `bson:"email" json:"email"`
	PasswordHash  string          `bson:"password_hash" json:"-"`
	Role          string          `bson:"role" json:"role"` // "user" or "admin"
	ParentPIN     string          `bson:"parent_pin,omitempty" json:"-"`
	ChildProfiles []ChildProfile  `bson:"child_profiles,omitempty" json:"child_profiles,omitempty"`
	ActiveChildID *bson.ObjectID  `bson:"active_child_id,omitempty" json:"active_child_id,omitempty"`
	CreatedAt     time.Time       `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time       `bson:"updated_at" json:"updated_at"`
}
