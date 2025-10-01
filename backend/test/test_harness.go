package test

import (
	"context"
	"fmt"
	"log"
	"os"
	"plange/backend/api"
	"plange/backend/model"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var admin *gorm.DB
var dbHost string
var dbUser string
var dbPassword string
var ctx context.Context

type SeedData struct {
	Account         model.Account
	Availability    model.Availability
	Booking         model.Booking
	CustomerContact model.CustomerContact
	Occasion        model.Occasion
	Restaurant      model.Restaurant
	Ctx             context.Context
}

// TestMain is a global pre-test hook where we can set up the testing environment before starting the tests
func TestMain(m *testing.M) {
	dbHost = os.Getenv("DB_HOST")
	if dbHost == "" {
		log.Panic("DB_HOST environment variable is empty. Cannot connect to testing database.")
	}
	dbUser = os.Getenv("DB_USER")
	if dbUser == "" {
		log.Panic("DB_USER environment variable is empty. Cannot connect to testing database.")
	}
	dbPassword = os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		log.Panic("DB_PASSWORD environment variable is empty. Cannot connect to testing database.")
	}

	adminDSN := fmt.Sprintf("host=%s user=%s password=%s dbname=postgres port=5432 sslmode=disable",
		dbHost, dbUser, dbPassword)

	ctx = context.Background()

	var err error // Set this so that admin can be set directly when calling gorm.Open

	admin, err = gorm.Open(postgres.Open(adminDSN), &gorm.Config{})
	if err != nil {
		log.Panic("Unable to connect to testing database: %v", err)
	}

	code := m.Run()
	os.Exit(code)
}

func SeedDB(db *gorm.DB) SeedData {
	salt, hash := api.CreateSaltAndHashPassword("password")
	account := model.Account{
		Email:        "test@test.com",
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	}
	_ = gorm.G[model.Account](db).Create(ctx, &account)

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

	_ = gorm.G[model.Availability](db).Create(ctx, &availability)

	occasion := model.Occasion{
		AvailabilityID:  availability.ID,
		CloseDate:       time.Now(),
		HourMask:        0,
		YearlyRecurring: false,
	}

	_ = gorm.G[model.Occasion](db).Create(ctx, &occasion)

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

	_ = gorm.G[model.Restaurant](db).Create(ctx, &restaurant)

	customerContact := model.CustomerContact{
		GivenName:  "John",
		FamilyName: "Doe",
		Phone:      "0412345678",
		Email:      "my@chungus.com",
	}

	_ = gorm.G[model.CustomerContact](db).Create(ctx, &customerContact)

	booking := model.Booking{
		ContactID:       customerContact.ID,
		RestaurantID:    restaurant.ID,
		PartySize:       4,
		BookingDate:     time.Date(2026, 4, 3, 0, 0, 0, 0, time.UTC),
		TimeSlot:        8,
		CreationDate:    time.Now(),
		CustomerCreated: true,
		Attendance:      "pending",
		CustomerNotes:   "Feed me so much food I will explode please",
		RestaurantNotes: "yo this guy's weird",
	}

	_ = gorm.G[model.Booking](db).Create(ctx, &booking)

	return SeedData{
		Account:         account,
		Availability:    availability,
		Booking:         booking,
		CustomerContact: customerContact,
		Occasion:        occasion,
		Restaurant:      restaurant,
		Ctx:             ctx,
	}
}

// WithTestDB is a helper function. Automatically cleans up the test db after the test completes.
// example:
//
//	func TestMyFunction(t *testing.T) {
//		test.WithTestDB(t, func() {
//			// testing logic here
//		})
//	}
func WithTestDB(t *testing.T, testFunc func(db *gorm.DB)) {
	// Get the test name to create a new DB with it
	testDBName := fmt.Sprintf("%s_db", t.Name())

	// Create a new database from the template
	err := admin.Exec(`CREATE DATABASE $1 TEMPLATE $2`,
		testDBName,
		"stront_template").Error

	if err != nil {
		t.Fatalf("Error creating test database: %v", err)
	}

	// Create the connection string for connecting to this new test db
	testDSN := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable",
		dbHost,
		dbUser,
		dbPassword,
		testDBName)

	// Establish the connection to the database
	testDB, err := gorm.Open(postgres.Open(testDSN), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Register a deferred cleanup job for when the test finishes running
	t.Cleanup(func() {
		admin.Exec(`DROP DATABASE IF EXISTS $1`, testDBName)
	})

	testFunc(testDB)
}
