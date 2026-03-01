package auth

import (
	"fmt"
	"os"

	"github.com/go-chi/jwtauth/v5"
)

// TokenAuth is the shared JWTAuth instance initialized by Init().
var TokenAuth *jwtauth.JWTAuth

// Init reads JWT_SECRET from the environment and initializes TokenAuth.
// Panics if JWT_SECRET is not set — fail fast at startup.
func Init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("JWT_SECRET environment variable must be set")
	}
	TokenAuth = jwtauth.New("HS256", []byte(secret), nil)
}

// IssueToken creates and signs a JWT containing the given userID and role claims.
// Returns the signed token string or an error.
func IssueToken(userID string, role string) (string, error) {
	claims := map[string]interface{}{
		"user_id": userID,
		"role":    role,
	}
	_, tokenString, err := TokenAuth.Encode(claims)
	if err != nil {
		return "", fmt.Errorf("issue token: %w", err)
	}
	return tokenString, nil
}
