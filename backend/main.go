package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"plange/backend/model"
	"time"

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

	// bit mask for 9am-8:30pm
	const weekdayHours int64 = 0b0000000000000000001111111111111111111111111000000000000000000000
	// bit mask for 10am-6pm
	const weekendHours int64 = 0b0000000000000000000011111111111111111100000000000000000000000000

	account := model.Account{
		Email:        "admin@example.com",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
		Restaurants: []model.Restaurant{{
			Name:         "My Restaurant",
			Description:  "This is a restaurant",
			LocationText: "123 Apple St, Sydney NSW 2000",
			Availability: &model.Availability{
				MondayHourMask:    weekdayHours,
				TuesdayHourMask:   weekdayHours,
				WednesdayHourMask: weekdayHours,
				ThursdayHourMask:  weekdayHours,
				FridayHourMask:    weekdayHours,
				SaturdayHourMask:  weekendHours,
				SundayHourMask:    weekendHours,
				Exclusions: []model.AvailabilityExclusion{
					{
						CloseDate:       time.Now(),
						HourMask:        0,
						YearlyRecurring: false,
					},
				},
			},
		}},
	}

	db.Create(&account)

	//_ = gorm.G[model.Account](db.Session(&gorm.Session{FullSaveAssociations: true}).Clauses(clause.OnConflict{DoNothing: true})).Create(ctx, &account)

	appMux := lib.BindServeMux(mux, &appMiddleware)
	authedAppMux := lib.BindServeMux(mux, &authedAppMiddleware)

	appMux.Handle("POST /api/auth/login", &api.LoginHandler{JWTKey: &jwtKey})
	appMux.Handle("POST /api/auth/logout", &api.LogoutHandler{})

	appMux.Handle("POST /api/account/register", &api.RegisterAccountHandler{JWTKey: &jwtKey})
	authedAppMux.Handle("POST /api/account/delete", &api.DeleteAccountHandler{})

	authedAppMux.HandleFunc("GET /api/account/name", func(ctx api.AuthedAppContext, w http.ResponseWriter, r *http.Request) { w.Write([]byte(ctx.User.Email)) })

	server := http.Server{
		Addr:    fmt.Sprintf("localhost:%d", *port),
		Handler: mux,
	}

	log.Printf("Listening on on http://%s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
