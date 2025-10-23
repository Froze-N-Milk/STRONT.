package api

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestGetAvailabilities(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := GetAvailabilitiesHandler{}

		t.Run("Get Availabilities", func (t *testing.T) {
			now := time.Now()
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			_, err := h.handle(s.Ctx, db, s.Restaurant.ID, today)

			if err != nil {
				t.Errorf("unexpected query error")
			}
		})
		t.Run("Get Non-Existent Availabilities", func (t *testing.T) {
			now := time.Now()
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			_, err := h.handle(s.Ctx, db, uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"), today)

			if err == nil {
				t.Errorf("expected query error")
			}
		})
	})
}

func TestGetRawAvailabilities(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := GetRawAvailabilitiesHandler{}

		t.Run("Get Availabilities", func (t *testing.T) {
			_, err := h.handle(s.Ctx, db, s.Restaurant.ID, s.Account.Email)

			if err != nil {
				t.Errorf("unexpected query error")
			}
		})
		t.Run("Get Non-Existent Availabilities", func (t *testing.T) {
			_, err := h.handle(s.Ctx, db, uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"), "")

			if err == nil {
				t.Errorf("expected query error")
			}
		})
	})
}


func TestUpdateAvailabilities(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := UpdateAvailabilitiesHandler{}

		t.Run("Update Availabilities", func (t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, rawAvailabilities{
				ID:                s.Restaurant.ID,
				MondayHourMask:    0,
				TuesdayHourMask:   0,
				WednesdayHourMask: 0,
				ThursdayHourMask:  0,
				FridayHourMask:    0,
				SaturdayHourMask:  0,
				SundayHourMask:    0,
			})

			if err != nil {
				t.Errorf("unexpected query error: %#v", err)
			}
		})
		t.Run("Update Non-Existent Availabilities", func (t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, rawAvailabilities{
				ID:                uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
				MondayHourMask:    0,
				TuesdayHourMask:   0,
				WednesdayHourMask: 0,
				ThursdayHourMask:  0,
				FridayHourMask:    0,
				SaturdayHourMask:  0,
				SundayHourMask:    0,
			})

			if err == nil {
				t.Errorf("expected query error")
			}
		})
		t.Run("Update Un-owned Availabilities", func (t *testing.T) {
			err := h.handle(s.Ctx, db, "a", rawAvailabilities{
				ID:                s.Availability.ID,
				MondayHourMask:    0,
				TuesdayHourMask:   0,
				WednesdayHourMask: 0,
				ThursdayHourMask:  0,
				FridayHourMask:    0,
				SaturdayHourMask:  0,
				SundayHourMask:    0,
			})

			if err == nil {
				t.Errorf("expected query error")
			}
		})
	})
}
