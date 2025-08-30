package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"plange/backend/api"
	"plange/backend/vite"
)

func main() {
	port := flag.Int("port", 3000, "http port")
	flag.Parse()

	connectionString := "host=localhost user=admin password=password dbname=restaurant_db port=5432 sslmode=disable TimeZone=Australia/Sydney"
	db, err := gorm.Open(postgres.Open(connectionString))
	if err != nil {
		panic("failed to connect database")
	}

	mux := http.NewServeMux()
	vite.Adapter.AddRoute("/")
	vite.Adapter.AddRoute("/demo")
	vite.Adapter.AddRoute("/login")
	vite.Adapter.AddRoute("/sign-up")
	vite.Adapter.AddRoute("/account")
	mux.Handle("/", vite.Adapter.IntoHandler())

	ctx := context.Background()

	// Seed the database
	salt, hash := api.CreateSaltAndHashPassword("idfk")

	_ = gorm.G[api.Account](db.Clauses(clause.OnConflict{DoNothing: true})).Create(ctx, &api.Account{
		Email:        "oscar@fuck.mychungus.life",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	})

	// Seed the database
	salt, hash = api.CreateSaltAndHashPassword("password")

	_ = gorm.G[api.Account](db.Clauses(clause.OnConflict{DoNothing: true})).Create(ctx, &api.Account{
		Email:        "admin@example.com",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	})

	mux.Handle("POST /api/login", &api.LoginHandler{
		DB: db,
	})

	server := http.Server{
		Addr:    fmt.Sprintf("localhost:%d", *port),
		Handler: mux,
	}

	log.Printf("Listening on on http://%s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
