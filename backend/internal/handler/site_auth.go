package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/hadi/kidtube/internal/auth"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

type siteRegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type siteLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type siteLoginResponse struct {
	Token string `json:"token"`
}

// SiteRegister returns an http.HandlerFunc that registers a new site user.
// Returns 201 on success, 400 on validation error, 409 on duplicate email.
func SiteRegister(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req siteRegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.Email == "" || req.Password == "" {
			http.Error(w, "email and password are required", http.StatusBadRequest)
			return
		}
		if len(req.Password) < 8 {
			http.Error(w, "password must be at least 8 characters", http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "failed to process password", http.StatusInternalServerError)
			return
		}

		now := time.Now().UTC()
		user := models.User{
			Email:        req.Email,
			PasswordHash: string(hash),
			Role:         "user",
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		_, err = database.Collection(db.CollUsers).InsertOne(r.Context(), user)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				// Return generic message — don't reveal that the email is already registered
				http.Error(w, "registration failed", http.StatusConflict)
				return
			}
			http.Error(w, "failed to create user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

// SiteLogin returns an http.HandlerFunc that authenticates a site user and issues a JWT.
// Returns identical 401 for user-not-found and wrong-password to prevent credential enumeration.
// Admin credentials cannot be used — filter includes role="user".
func SiteLogin(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req siteLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.Email == "" || req.Password == "" {
			http.Error(w, "email and password are required", http.StatusBadRequest)
			return
		}

		// Filter by role="user" so admin credentials don't work on site login
		var user models.User
		filter := bson.D{
			{Key: "email", Value: req.Email},
			{Key: "role", Value: "user"},
		}
		err := database.Collection(db.CollUsers).FindOne(r.Context(), filter).Decode(&user)
		if err != nil {
			// Identical message for not-found and wrong-password to prevent credential enumeration
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		token, err := auth.IssueToken(user.ID.Hex(), "user")
		if err != nil {
			http.Error(w, "failed to issue token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(siteLoginResponse{Token: token}) //nolint:errcheck
	}
}
