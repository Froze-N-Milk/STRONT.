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
		Ctx: api.AppContext{DB: db},
	}
	authedAppMiddleware := api.AuthedAppMiddleware{
		Ctx: appMiddleware.Ctx,
		Auth: api.MakeAuthChecker(
			api.Api,
			&jwtKey,
		),
	}

	mux := http.NewServeMux()
	vite.Adapter.AddRoute("STRONT.", "/")
	vite.Adapter.AddRoute("Login - STRONT.", "/login")
	vite.Adapter.AddRoute("Sign Up - STRONT.", "/sign-up")
	vite.Adapter.AddRoute("Make Booking - STRONT.", "/restaurants/{restaurantid}/make-booking")
	vite.Adapter.AddAuthedRoute("Account - STRONT.", "/account")
	mux.Handle("/", vite.Adapter.IntoHandler(api.AuthedAppMiddleware{
		Ctx: appMiddleware.Ctx,
		Auth: api.MakeAuthChecker(
			api.Frontend,
			&jwtKey,
		),
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
			Tags:            []string{"mine", "test", "i own this place!"},
		}

		gorm.G[model.Restaurant](db.Clauses(clause.OnConflict{DoNothing: true}, result)).Create(ctx, &restaurant)

		// ===== EXTRA BOOKINGS: Donald Fungus & Charles Brungus =====
		// Add their customer contact records first
		gorm.G[any](db).Exec(ctx, `
INSERT INTO customer_contact (id, given_name, family_name, phone, email) VALUES
('00000000-0000-0000-0000-000000000006', 'Donald', 'Fungus', '+1 555-0106', 'donald.fungus@example.com'),
('00000000-0000-0000-0000-000000000007', 'Charles', 'Brungus', '+1 555-0107', 'charles.brungus@example.com')
`)

		// ===== BOOKINGS ON 22ND OCTOBER 2025 =====
		gorm.G[any](db).Raw(`
INSERT INTO booking (id, contact_id, restaurant_id, party_size, booking_date, time_slot, creation_date, attendance, customer_notes, restaurant_notes) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', $1, 2, '2025-10-22', 18, '2025-10-10 12:00:00+00', 'pending', 'Dinner with a friend.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', $1, 4, '2025-10-22', 19, '2025-10-09 14:15:00+00', 'attended', 'Group dinner for 4.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', $1, 3, '2025-10-22', 20, '2025-10-08 11:30:00+00', 'pending', 'Evening outing.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', $1, 5, '2025-10-22', 17, '2025-10-06 10:45:00+00', 'cancelled', 'Cancelled due to work.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', $1, 6, '2025-10-22', 21, '2025-10-05 16:50:00+00', 'no-show', 'Forgot reservation.', '')
`, restaurant.ID).Find(ctx)

		// ===== BOOKINGS ON 24TH OCTOBER 2025 =====
		gorm.G[any](db).Raw(`
INSERT INTO booking (id, contact_id, restaurant_id, party_size, booking_date, time_slot, creation_date, attendance, customer_notes, restaurant_notes) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', $1, 2, '2025-10-24', 19, '2025-10-11 09:10:00+00', 'pending', 'Casual dinner with partner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', $1, 4, '2025-10-24', 18, '2025-10-07 15:40:00+00', 'attended', 'Business meeting.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', $1, 3, '2025-10-24', 17, '2025-10-12 18:20:00+00', 'pending', 'Dinner with family.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', $1, 2, '2025-10-24', 20, '2025-10-09 11:55:00+00', 'cancelled', 'Rescheduled due to travel.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', $1, 5, '2025-10-24', 21, '2025-10-08 10:30:00+00', 'pending', 'Birthday dinner.', '')
`, restaurant.ID).Find(ctx)


// ===== BOOKINGS (all before 2025-10-21) =====
		gorm.G[any](db).Raw(`
INSERT INTO booking (id, contact_id, restaurant_id, party_size, booking_date, time_slot, creation_date, attendance, customer_notes, restaurant_notes) VALUES
-- James Chrongus
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008', $1, 2, '2025-10-19', 18, '2025-10-10 13:20:00+00', 'attended', 'Casual dinner outing.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008', $1, 4, '2025-10-18', 19, '2025-10-05 17:00:00+00', 'pending', 'Group dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008', $1, 3, '2025-10-16', 20, '2025-10-03 11:35:00+00', 'no-show', 'Forgot booking.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008', $1, 2, '2025-09-28', 21, '2025-09-15 09:25:00+00', 'attended', 'Weekend dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008', $1, 5, '2025-09-22', 18, '2025-09-12 08:40:00+00', 'cancelled', 'Had to cancel.', ''),

-- Michael Cuxley
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', $1, 3, '2025-10-19', 17, '2025-10-09 15:45:00+00', 'pending', 'Dinner with coworkers.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', $1, 2, '2025-10-14', 19, '2025-10-01 19:10:00+00', 'attended', 'Evening meal.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', $1, 4, '2025-10-10', 20, '2025-09-30 10:05:00+00', 'no-show', 'Missed booking.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', $1, 2, '2025-09-25', 18, '2025-09-18 16:55:00+00', 'attended', 'Lunch with a client.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', $1, 6, '2025-09-15', 19, '2025-09-05 12:00:00+00', 'cancelled', 'Rescheduled meeting.', ''),

-- Bruce Bloje
(gen_random_uuid(), '00000000-0000-0000-0000-000000000010', $1, 1, '2025-10-12', 13, '2025-09-28 18:10:00+00', 'attended', 'Solo lunch.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000010', $1, 2, '2025-10-11', 17, '2025-09-27 14:20:00+00', 'pending', 'Late dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000010', $1, 3, '2025-10-07', 18, '2025-09-25 11:15:00+00', 'cancelled', 'Unable to attend.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000010', $1, 2, '2025-09-30', 19, '2025-09-21 09:40:00+00', 'no-show', 'Did not arrive.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000010', $1, 5, '2025-09-20', 20, '2025-09-08 16:25:00+00', 'attended', 'Birthday dinner.', ''),

-- Marques Brownlee
(gen_random_uuid(), '00000000-0000-0000-0000-000000000011', $1, 2, '2025-10-17', 18, '2025-10-05 10:05:00+00', 'attended', 'Dinner and tech talk.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000011', $1, 4, '2025-10-15', 19, '2025-10-02 13:40:00+00', 'pending', 'Filming crew dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000011', $1, 3, '2025-10-08', 20, '2025-09-29 17:50:00+00', 'no-show', 'Travel conflict.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000011', $1, 6, '2025-09-24', 17, '2025-09-14 12:25:00+00', 'attended', 'Business dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000011', $1, 5, '2025-09-10', 21, '2025-09-01 11:30:00+00', 'cancelled', 'Meeting ran late.', ''),

-- others
(gen_random_uuid(), '00000000-0000-0000-0000-000000000012', $1, 5, '2025-10-12', 19, '2025-09-30 11:15:00+00', 'attended', 'Family dinner after training.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000013', $1, 2, '2025-10-10', 18, '2025-09-25 14:50:00+00', 'attended', 'Dinner before flight.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000014', $1, 3, '2025-10-08', 17, '2025-09-20 09:10:00+00', 'cancelled', 'Business dinner with sponsors.', 'Cancelled due to last-minute endorsement event.'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000015', $1, 4, '2025-09-30', 20, '2025-09-12 16:05:00+00', 'attended', 'Team night out.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000016', $1, 6, '2025-09-25', 21, '2025-09-05 18:30:00+00', 'no-show', 'Missed due to travel.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000017', $1, 2, '2025-09-18', 19, '2025-09-01 13:45:00+00', 'attended', 'Quiet dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000018', $1, 4, '2025-09-15', 18, '2025-08-31 15:55:00+00', 'pending', 'Dinner with friends.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000019', $1, 3, '2025-09-12', 17, '2025-08-28 19:10:00+00', 'attended', 'Preseason meal.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000020', $1, 5, '2025-09-10', 20, '2025-08-26 11:25:00+00', 'cancelled', 'Team dinner celebration.', 'Cancelled due to travel schedule change.'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000021', $1, 2, '2025-09-07', 18, '2025-08-25 14:00:00+00', 'attended', 'Relaxed dinner with family.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000022', $1, 3, '2025-09-02', 17, '2025-08-20 10:40:00+00', 'attended', 'Quiet dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000023', $1, 6, '2025-08-30', 20, '2025-08-10 13:30:00+00', 'cancelled', 'Private dinner with team.', 'Cancelled because of unexpected team flight.'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000024', $1, 2, '2025-08-22', 19, '2025-08-01 11:15:00+00', 'no-show', 'Did not confirm.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000025', $1, 4, '2025-08-18', 21, '2025-07-30 12:25:00+00', 'attended', 'Dinner after practice.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000026', $1, 3, '2025-08-12', 19, '2025-07-28 09:50:00+00', 'pending', 'Casual meal.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000027', $1, 5, '2025-08-10', 18, '2025-07-25 16:45:00+00', 'attended', 'Dinner with family.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000028', $1, 2, '2025-08-05', 17, '2025-07-20 13:05:00+00', 'attended', 'Retired life meal.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000029', $1, 3, '2025-08-02', 19, '2025-07-15 10:10:00+00', 'cancelled', 'Dinner with media crew.', 'Cancelled because of media schedule change.'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000030', $1, 6, '2025-07-25', 20, '2025-07-10 15:40:00+00', 'attended', 'Legends dinner.', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000031', $1, 4, '2025-07-22', 18, '2025-07-05 12:00:00+00', 'attended', 'Special guest reservation.', '')
`, restaurant.ID).Find(ctx)

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
	authedAppMux.Handle("GET /api/booking/upcoming/{restaurant}", &api.GetUpcomingBookingsHandler{})
	authedAppMux.Handle("GET /api/booking/history/{restaurant}", &api.GetBookingHistoryHandler{})
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
