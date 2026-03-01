package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hadi/kidtube/internal/auth"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token string `json:"token"`
}

// Login returns an http.HandlerFunc that authenticates an admin user and issues a JWT.
// It follows the same dependency-injection pattern as HealthHandler.
func Login(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if req.Email == "" || req.Password == "" {
			http.Error(w, "email and password are required", http.StatusBadRequest)
			return
		}

		// Find user by email and role=admin
		var user models.User
		filter := bson.D{
			{Key: "email", Value: req.Email},
			{Key: "role", Value: "admin"},
		}
		err := database.Collection(db.CollUsers).FindOne(r.Context(), filter).Decode(&user)
		if err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		// Compare supplied password against stored hash
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		// Issue JWT
		token, err := auth.IssueToken(user.ID.Hex(), "admin")
		if err != nil {
			http.Error(w, "failed to issue token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(loginResponse{Token: token}) //nolint:errcheck
	}
}
