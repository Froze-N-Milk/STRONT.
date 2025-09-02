package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"plange/backend/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"plange/backend/api"
	"plange/backend/lib"
	"plange/backend/vite"
)

func main() {
	port := flag.Int("port", 3000, "http port")
	jwtKeyFile := flag.String("jwt-key-file", ".jwt-key", "file that contains base64 encoded jwt signing key")
	flag.Parse()

	jwtKey, err := api.GetOrMakeJWTSigningKey(*jwtKeyFile)
	if err != nil {
		panic(err)
	}

	connectionString := "host=localhost user=admin password=password dbname=restaurant_db port=5432 sslmode=disable TimeZone=Australia/Sydney"
	db, err := gorm.Open(postgres.Open(connectionString))
	if err != nil {
		log.Panic("failed to connect database", err)
	}

	appMiddleware := api.AppMiddleware{
		DB: api.DBMiddleware{DB: db},
	}
	authedAppMiddleware := api.AuthedAppMiddleware{
		Auth: api.AuthMiddleware{
			Mode: api.Api,
			Key:  &jwtKey,
		},
	}

	mux := http.NewServeMux()
	vite.Adapter.AddRoute("/")
	vite.Adapter.AddRoute("/demo")
	vite.Adapter.AddRoute("/login")
	vite.Adapter.AddRoute("/sign-up")
	vite.Adapter.AddAuthedRoute("/account")
	mux.Handle("/", vite.Adapter.IntoHandler(api.AuthMiddleware{
		Mode: api.Frontend,
		Key:  &jwtKey,
	}))

	ctx := context.Background()

	// Seed the database
	salt, hash := api.CreateSaltAndHashPassword("idfk")

	_ = gorm.G[model.Account](db.Clauses(clause.OnConflict{DoNothing: true})).Create(ctx, &model.Account{
		Email:        "oscar@fuck.mychungus.life",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	})

	// Seed the database
	salt, hash = api.CreateSaltAndHashPassword("password")

	_ = gorm.G[model.Account](db.Clauses(clause.OnConflict{DoNothing: true})).Create(ctx, &model.Account{
		Email:        "admin@example.com",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	})

	mux.Handle("POST /api/login", appMiddleware.Service(&api.LoginHandler{
		JWTKey: &jwtKey,
	}))

	mux.Handle("POST /api/sign-up", appMiddleware.Service(&api.SignUpHandler{
		JWTKey: &jwtKey,
	}))

	mux.Handle("POST /api/logout", appMiddleware.Service(&api.LogoutHandler{}))

	mux.Handle("GET /api/account", authedAppMiddleware.Service(lib.HandlerFunc[api.AuthedAppContext](func(ctx api.AuthedAppContext, w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(ctx.User.Email))
	})))

	server := http.Server{
		Addr:    fmt.Sprintf("localhost:%d", *port),
		Handler: mux,
	}

	log.Printf("Listening on on http://%s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
