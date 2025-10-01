package api

import (
	"plange/backend/test"
	"testing"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestGetBookingByID(t *testing.T) {
	test.WithTestDB(t, func(db *gorm.DB) {
		seedData := test.SeedDB(db)
		handler := GetBookingByIDHandler{}

		t.Run("Correct Booking ID", func(t *testing.T) {
			expected := bookingRequest{
				RestaurantID:  seedData.Restaurant.ID,
				GivenName:     seedData.CustomerContact.GivenName,
				FamilyName:    seedData.CustomerContact.FamilyName,
				Phone:         seedData.CustomerContact.Phone,
				Email:         seedData.CustomerContact.Email,
				PartySize:     seedData.Booking.PartySize,
				BookingDate:   seedData.Booking.BookingDate,
				TimeSlot:      seedData.Booking.TimeSlot,
				CustomerNotes: seedData.Booking.CustomerNotes,
			}
			response, err := handler.handle(seedData.Ctx, db, seedData.Booking.ID)
			if err != nil {
				t.Errorf("error running GetBookingByIDHandler.handle()")
			}
			if response != expected {
				t.Errorf(`GetBookingByIDHandler.handle(ctx, *db, uuid) = %+v, want %+v`, response, expected)
			}
		})
		t.Run("Invalid Booking ID", func(t *testing.T) {
			response, err := handler.handle(seedData.Ctx, db, uuid.New())
			if err == nil {
				t.Errorf("Expected error, got %+v", response)
			}
		})
	})
}
