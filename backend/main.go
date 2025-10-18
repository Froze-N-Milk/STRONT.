package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"plange/backend/api"
	"plange/backend/lib"
	"plange/backend/model"
	"plange/backend/vite"
)

func connectWithRetry(dsn string, maxRetries int, delay time.Duration) (*gorm.DB, error) {
	var db *gorm.DB
	var err error

	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			sqlDB, errPing := db.DB()
			if errPing == nil && sqlDB.Ping() == nil {
				log.Println("Connected to Postgres!")
				return db, nil
			}
		}

		log.Printf("Database not ready (attempt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(delay)
	}

	return nil, fmt.Errorf("could not connect to database after %d attempts: %w", maxRetries, err)
}

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

	// Try connecting to the DB 8 times, with a 5 second delay between each, before giving up.
	db, err := connectWithRetry(connectionString, 8, 5*time.Second)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
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
	vite.Adapter.AddRoute("STRONT.", "/")
	vite.Adapter.AddRoute("Login - STRONT.", "/login")
	vite.Adapter.AddRoute("Sign Up - STRONT.", "/sign-up")
	vite.Adapter.AddRoute("Make Booking - STRONT.", "/restaurants/{restaurantid}/make-booking")
	vite.Adapter.AddAuthedRoute("Account - STRONT.", "/account")
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
			CloseDate:       time.Now(),
			HourMask:        0,
			YearlyRecurring: false,
		}

		gorm.G[model.Occasion](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &occasion)

		restaurant := model.Restaurant{
			AccountID:       account.ID,
			AvailabilityID:  availability.ID,
			Name:            "My Restaurant",
			Description:     "This is a restaurant",
			LocationText:    "123 Apple St, Sydney NSW 2000",
			MaxPartySize:    5,
			BookingCapacity: 100,
			BookingLength:   2,
		}

		gorm.G[model.Restaurant](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &restaurant)
	}

	emailHelper := api.EmailHelper{
		LocalHost: vite.IsDev,
		// NOTE: if you are testing sending email, fill in this variable
		// to ensure that it only sends to the listed addresses, leaving
		// it empty will send to any address
		AllowedAddresses: []string{},
		// NOTE: set these environment variables in order to enable setting email
		Username: os.Getenv("STRONT_MAIL_USERNAME"),
		Password: os.Getenv("STRONT_MAIL_PASSWORD"),
	}

	slog.Debug(fmt.Sprintf("%#v", emailHelper))

	// bind endpoints

	appMux := lib.BindServeMux(mux, &appMiddleware)
	authedAppMux := lib.BindServeMux(mux, &authedAppMiddleware)

	appMux.Handle("POST /api/auth/login", &api.LoginHandler{JWTKey: &jwtKey})
	appMux.Handle("POST /api/auth/logout", &api.LogoutHandler{})

	appMux.Handle("POST /api/account/register", &api.RegisterAccountHandler{JWTKey: &jwtKey})
	authedAppMux.Handle("POST /api/account/delete", &api.DeleteAccountHandler{})
	authedAppMux.Handle("POST /api/account/update", &api.UpdateAccountHandler{JWTKey: &jwtKey})
	authedAppMux.Handle("GET /api/account/restaurants", &api.AccountManagedRestaurantsHandler{})

	authedAppMux.HandleFunc("GET /api/account/name", func(ctx api.AuthedAppContext, w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(ctx.User.Email))
	})

	appMux.Handle("GET /api/availability/{restaurant}", &api.GetAvailabilitiesHandler{})
	authedAppMux.Handle("POST /api/availability/update", &api.UpdateAvailabilitiesHandler{})

	appMux.Handle("GET /api/restaurants", &api.BrowseRestaurantsHandler{})
	appMux.Handle("GET /api/restaurant/{restaurant}", &api.RestaurantDetailsHandler{})
	authedAppMux.Handle("POST /api/restaurant/create", &api.CreateRestaurantHandler{})
	authedAppMux.Handle("POST /api/restaurant/delete", &api.DeleteRestaurantHandler{})
	authedAppMux.Handle("POST /api/restaurant/update", &api.UpdateRestaurantHandler{})

	authedAppMux.Handle("POST /api/restaurant/occasion/create", &api.CreateOccasionHandler{})
	authedAppMux.Handle("POST /api/restaurant/occasion/delete", &api.DeleteOccasionHandler{})
	authedAppMux.Handle("POST /api/restaurant/occasion/update", &api.UpdateOccasionHandler{})

	appMux.Handle("GET /booking/cal/{id}", &api.BookingIcsHandler{LocalHost: vite.IsDev})
	appMux.Handle("GET /api/booking/{booking}", &api.GetBookingByIDHandler{})
	appMux.Handle("POST /api/booking/create", &api.CreateOnlineBookingHandler{EmailHelper: emailHelper})
	appMux.Handle("POST /api/booking/edit/{booking}", &api.UpdateBookingHandler{})
	appMux.Handle("POST /api/booking/cancel/{booking}", &api.CancelBookingHandler{})
	mux.Handle("GET /api/booking/upcoming/{restaurant}", &api.GetUpcomingBookingsHandler{DB: db, JWTKey: &jwtKey})
	mux.Handle("GET /api/booking/history/{restaurant}", &api.GetBookingHistoryHandler{DB: db, JWTKey: &jwtKey})
	authedAppMux.Handle("POST /api/booking/restaurant-notes/{booking}", &api.UpdateRestaurantNotesHandler{})
	authedAppMux.Handle("POST /api/booking/attendance/{booking}", &api.UpdateAttendanceHandler{})

	server := http.Server{
		Addr:    hostString,
		Handler: mux,
	}

	log.Printf("Listening on on http://%s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
