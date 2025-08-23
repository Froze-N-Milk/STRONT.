package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"plange/api"
	"plange/backend/vite"
)

func main() {
	port := flag.Int("port", 3000, "http port")
	flag.Parse()

	db, err := gorm.Open(sqlite.Open("local.db"), &gorm.Config{})
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
