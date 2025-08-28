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

	"plange/api"
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
	vite.Adapter.AddRoute("/index.html")
	vite.Adapter.AddRoute("/demo")
	mux.Handle("/", vite.Adapter.IntoHandler())

	ctx := context.Background()

	mux.Handle("POST /create-event", &api.CreateEvent{
		DB:  db,
		CTX: &ctx,
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
