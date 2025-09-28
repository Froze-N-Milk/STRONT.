package test

import (
	"fmt"
	"log"
	"os"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var admin *gorm.DB
var dbHost string
var dbUser string
var dbPassword string

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

	var err error // Set this so that admin can be set directly when calling gorm.Open

	admin, err = gorm.Open(postgres.Open(adminDSN), &gorm.Config{})
	if err != nil {
		log.Panic("Unable to connect to testing database: %v", err)
	}

	code := m.Run()
	os.Exit(code)
}

// Use this in a test function. Automatically cleans up the test db after the test completes.
// example:
//
//	func TestMyFunction(t *testing.T) {
//		test.withTestDB(t, func() {
//			// testing logic here
//		})
//	}
func withTestDB(t *testing.T, testFunc func(db *gorm.DB)) {
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
