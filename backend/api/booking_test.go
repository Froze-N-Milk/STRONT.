package api

import (
	"plange/backend/model"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestGetBookingByID(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)
		handler := GetBookingByIDHandler{}

		t.Run("Correct Booking ID", func(t *testing.T) {
			expected := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     s.Booking.PartySize,
				BookingDate:   s.Booking.BookingDate,
				TimeSlot:      s.Booking.TimeSlot,
				CustomerNotes: s.Booking.CustomerNotes,
			}
			response, err := handler.handle(s.Ctx, db, s.Booking.ID)
			if err != nil {
				t.Errorf("error running GetBookingByIDHandler.handle()")
			}
			if response != expected {
				t.Errorf(`GetBookingByIDHandler.handle(ctx, *db, uuid) = %+v, want %+v`, response, expected)
			}
		})
		t.Run("Invalid Booking ID", func(t *testing.T) {
			response, err := handler.handle(s.Ctx, db, uuid.New())
			if err == nil {
				t.Errorf("Expected error, got %+v", response)
			}
		})
	})
}

func TestCreateOnlineBooking(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)
		handler := CreateOnlineBookingHandler{}

		t.Run("Valid Booking Data", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}

			db.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
			response, err := handler.handle(s.Ctx, db, br)
			if err != nil {
				db.Rollback()
				t.Errorf("error running CreateOnlineBookingHandler.handle(): %v", err)
				return
			}

			bookingRow, err := gorm.G[model.Booking](db).Where("id = ?", response.ID).First(ctx)
			if err != nil {
				t.Errorf("failed retrieving bookingRow from database: %v", err)
				return
			}

			if !(bookingRow.ContactID == response.ContactID &&
				bookingRow.RestaurantID == response.RestaurantID &&
				bookingRow.PartySize == response.PartySize &&
				bookingRow.TimeSlot == response.TimeSlot &&
				bookingRow.CustomerCreated == response.CustomerCreated &&
				bookingRow.Attendance == response.Attendance &&
				bookingRow.CustomerNotes == response.CustomerNotes &&
				bookingRow.RestaurantNotes == response.RestaurantNotes) {
				t.Errorf("response does not match bookingRow returned from db query")
				return
			}

			contactRow, err := gorm.G[model.CustomerContact](db).Where("id = ?", response.ContactID).First(ctx)
			if err != nil {
				t.Errorf("failed retrieving contactRow from database: %v", err)
				return
			}

			if !(br.GivenName == contactRow.GivenName &&
				br.FamilyName == contactRow.FamilyName &&
				br.Phone == contactRow.Phone &&
				br.Email == contactRow.Email) {
				t.Errorf("response does not match contactRow returned from db query")
				return
			}
		})
		t.Run("Reject Negative Party Size", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     -4,
				BookingDate:   time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err == nil {
				t.Errorf("expected error, got %v", response)
			}
		})
		t.Run("Reject Part Size Too Large", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     13,
				BookingDate:   time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err == nil {
				t.Errorf("expected error, got %v", response)
			}
		})
		t.Run("Reject Negative Time Slot", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
				TimeSlot:      -12,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err == nil {
				t.Errorf("expected error, got %v", response)
			}
		})
		t.Run("Reject Time Slot During Closed Hours", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
				TimeSlot:      0,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err == nil {
				t.Errorf("expected error, got %v", response)
			}
		})
		t.Run("Reject Booking Date on Closed Day", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 7, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err == nil {
				t.Errorf("expected error, got %v", response)
			}
		})
		t.Run("Reject Booking When Restaurant Capacity Reached", func(t *testing.T) {
			lowCapacityRestaurant := model.Restaurant{
				AccountID:       s.Account.ID,
				AvailabilityID:  s.Availability.ID,
				Name:            "No Tables",
				Description:     "Too Small",
				LocationText:    "000 Empty St, Alice Springs NT 1000",
				MaxPartySize:    8,
				BookingCapacity: 1,
				BookingLength:   2,
			}

			db.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
			err := gorm.G[model.Restaurant](db).Create(ctx, &lowCapacityRestaurant)
			if err != nil {
				db.Rollback()
				t.Errorf("unexpected error when setting up test environment: %v", err)
				return
			}

			c := model.CustomerContact{
				GivenName:  "Jill",
				FamilyName: "Roe",
				Phone:      "0487654321",
				Email:      "your@chungus.com",
			}

			br1 := bookingRequest{
				RestaurantID:  lowCapacityRestaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 6, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}

			_, err = handler.handle(ctx, db, br1)
			if err != nil {
				db.Rollback()
				t.Errorf("expected successful response, got error: %v", err)
				return
			}

			br2 := bookingRequest{
				RestaurantID:  lowCapacityRestaurant.ID,
				GivenName:     c.GivenName,
				FamilyName:    c.FamilyName,
				Phone:         c.Phone,
				Email:         c.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 7, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}

			response, err := handler.handle(ctx, db, br2)
			if err == nil {
				t.Errorf("expected error, got response: %v", response)
			}
		})
	})
}

func TestUpdateBooking(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)
		handler := UpdateBookingHandler{}

		t.Run("Accept Valid Booking Update", func(t *testing.T) {
			createBookingHandler := CreateOnlineBookingHandler{}
			// Set up booking to update
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     s.CustomerContact.GivenName,
				FamilyName:    s.CustomerContact.FamilyName,
				Phone:         s.CustomerContact.Phone,
				Email:         s.CustomerContact.Email,
				PartySize:     4,
				BookingDate:   time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
				TimeSlot:      24,
				CustomerNotes: "yay",
			}

			db.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
			response, err := createBookingHandler.handle(s.Ctx, db, br)
			if err != nil {
				db.Rollback()
				t.Errorf("error running CreateOnlineBookingHandler.handle(): %v", err)
				return
			}
			// db.Commit()

			ur := updateBookingRequest{
				TimeSlot:      25,
				PartySize:     3,
				CustomerNotes: "lmao dude",
			}

			err = handler.handle(s.Ctx, db, ur, response.ID)

			if err != nil {
				t.Errorf("error running UpdateBookingHandler.handle(): %v", err)
			}
		})
	})
}
