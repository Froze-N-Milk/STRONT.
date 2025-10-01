package api

import (
	"plange/backend/model"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestGetBookingByID(t *testing.T) {
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
				PartySize:     13,
				BookingDate:   time.Date(2026, 1, 1, 0, 0, 0, 0, time.Local),
				TimeSlot:      12,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err != nil {
				t.Errorf("error running CreateOnlineBookingHandler.handle(): %v", err)
			}

			bookingRow, err := gorm.G[model.Booking](db).Where("id = ?", response.ID).First(ctx)
			if err != nil {
				t.Errorf("failed retrieving bookingRow from database: %v", err)
			}

			// TODO: Fix timezone issues between sending and retrieving from db
			if !(bookingRow.ContactID == response.ContactID &&
				bookingRow.RestaurantID == response.RestaurantID &&
				bookingRow.PartySize == response.PartySize &&
				bookingRow.TimeSlot == response.TimeSlot &&
				bookingRow.CustomerCreated == response.CustomerCreated &&
				bookingRow.Attendance == response.Attendance &&
				bookingRow.CustomerNotes == response.CustomerNotes &&
				bookingRow.RestaurantNotes == response.RestaurantNotes) {
				t.Errorf("response does not match bookingRow returned from db query")
			}

			contactRow, err := gorm.G[model.CustomerContact](db).Where("id = ?", response.ContactID).First(ctx)
			if err != nil {
				t.Errorf("failed retrieving contactRow from database: %v", err)
			}

			if !(br.GivenName == contactRow.GivenName &&
				br.FamilyName == contactRow.FamilyName &&
				br.Phone == contactRow.Phone &&
				br.Email == contactRow.Email) {
				t.Errorf("response does not match contactRow returned from db query")
			}
		})
		t.Run("Invalid Booking Data", func(t *testing.T) {
			br := bookingRequest{
				RestaurantID:  s.Restaurant.ID,
				GivenName:     "",
				FamilyName:    "zoinkeroonies",
				Phone:         "jinkies",
				Email:         "1234556666667778",
				PartySize:     -4,
				BookingDate:   time.Date(60000000, 1, 1, 0, 0, 0, 0, time.UTC),
				TimeSlot:      17,
				CustomerNotes: "yay",
			}
			response, err := handler.handle(s.Ctx, db, br)
			if err == nil {
				t.Errorf("expected error, got %v", response)
			}
		})
	})
}
