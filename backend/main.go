package main

import (
	"context"
	"flag"
	"log"
	"log/slog"
	"net/http"
	"os"
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
	hostString := os.Getenv("HOST_STRING")
	if hostString == "" {
		hostString = "localhost:3000"
	}
	jwtKeyFile := flag.String("jwt-key-file", ".jwt-key", "file that contains base64 encoded jwt signing key")
	flag.Parse()

	// set debug events on atm
	slog.SetLogLoggerLevel(slog.LevelDebug)

	jwtKey, err := api.GetOrMakeJWTSigningKey(*jwtKeyFile)
	if err != nil {
		panic(err)
	}

	connectionString := os.Getenv("DB_CONNECTION_STRING")
	if connectionString == "" {
		log.Panic("No connection string set in env variable DB_CONNECTION_STRING")
	}

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

	result := gorm.WithResult()

	account := model.Account{
		Email:        "admin@example.com",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	}

	err = gorm.G[model.Account](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &account)

	if err == nil {
		// bit mask for 9am-8:30pm
		const weekdayHours int64 = 0b0000000000000000000000000000000001111111111111111111111111000000
		// bit mask for 10am-6pm
		const weekendHours int64 = 0b0000000000000000000000000000000000011111111111111111100000000000

		availability := model.Availability{
			MondayHourMask:    weekdayHours,
			TuesdayHourMask:   weekdayHours,
			WednesdayHourMask: weekdayHours,
			ThursdayHourMask:  weekdayHours,
			FridayHourMask:    weekdayHours,
			SaturdayHourMask:  weekendHours,
			SundayHourMask:    weekendHours,
		}

		gorm.G[model.Availability](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &availability)

		occasion := model.Occasion{
			AvailabilityID:  availability.ID,
			Date:            time.Now(),
			HourMask:        0,
			YearlyRecurring: false,
		}

		gorm.G[model.Occasion](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &occasion)

		restaurant := model.Restaurant{
			AccountID:      account.ID,
			AvailabilityID: availability.ID,
			Name:           "My Restaurant",
			Description:    "This is a restaurant",
			LocationText:   "123 Apple St, Sydney NSW 2000",
		}

		gorm.G[model.Restaurant](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &restaurant)
	}

	// bind endpoints

	appMux := lib.BindServeMux(mux, &appMiddleware)
	authedAppMux := lib.BindServeMux(mux, &authedAppMiddleware)

	appMux.Handle("POST /api/auth/login", &api.LoginHandler{JWTKey: &jwtKey})
	appMux.Handle("POST /api/auth/logout", &api.LogoutHandler{})

	appMux.Handle("POST /api/account/register", &api.RegisterAccountHandler{JWTKey: &jwtKey})
	authedAppMux.Handle("POST /api/account/delete", &api.DeleteAccountHandler{})
	authedAppMux.Handle("POST /api/account/update", &api.UpdateAccountHandler{JWTKey: &jwtKey})

	authedAppMux.HandleFunc("GET /api/account/name", func(ctx api.AuthedAppContext, w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(ctx.User.Email))
	})

	appMux.Handle("GET /api/availability/{restaurant}", &api.GetAvailabilitiesHandler{})
	authedAppMux.Handle("POST /api/availability/update", &api.UpdateAvailabilitiesHandler{})

	authedAppMux.Handle("POST /api/restaurants/create", &api.CreateRestaurantHandler{})

	server := http.Server{
		Addr:    hostString,
		Handler: mux,
	}

	log.Printf("Listening on on http://%s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
