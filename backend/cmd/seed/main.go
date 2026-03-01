package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/hadi/kidtube/internal/db"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI environment variable must be set")
	}

	email := os.Getenv("ADMIN_EMAIL")
	if email == "" {
		log.Fatal("ADMIN_EMAIL environment variable must be set")
	}

	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		log.Fatal("ADMIN_PASSWORD environment variable must be set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	database, err := db.Connect(ctx, mongoURI)
	if err != nil {
		log.Fatalf("seed: failed to connect to MongoDB: %v", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("seed: failed to hash password: %v", err)
	}

	now := time.Now().UTC()
	filter := bson.D{{Key: "email", Value: email}}
	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "password_hash", Value: string(hash)},
			{Key: "role", Value: "admin"},
			{Key: "updated_at", Value: now},
		}},
		{Key: "$setOnInsert", Value: bson.D{
			{Key: "email", Value: email},
			{Key: "created_at", Value: now},
		}},
	}
	upsert := true
	opts := options.UpdateOne().SetUpsert(upsert)

	_, err = database.Collection(db.CollUsers).UpdateOne(ctx, filter, update, opts)
	if err != nil {
		log.Fatalf("seed: failed to upsert admin user: %v", err)
	}

	fmt.Printf("Admin user seeded: %s\n", email)
}
