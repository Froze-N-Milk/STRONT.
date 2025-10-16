package api

import (
	"testing"
	"time"

	"gorm.io/gorm"
)

func TestCreateOccasion(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := CreateOccasionHandler{}

		t.Run("Create Occasion", func(t *testing.T) {
			now := time.Now()
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			err := h.handle(s.Ctx, db, s.Account.Email, occasionRequest{
				CloseDate:  today,
				Restaurant: s.Restaurant.ID,
			})
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}
		})
	})
}

func TestUpdateOccasion(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := UpdateOccasionHandler{}

		t.Run("Update Occasion", func(t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, occasionDetails{
				Hours:     0,
				Recurring: false,
				occasionRequest: occasionRequest{
					CloseDate:  s.Occasion.CloseDate,
					Restaurant: s.Restaurant.ID,
				},
			})
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}
		})

		t.Run("Update Non-Existent Occasion", func(t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, occasionDetails{
				Hours:     0,
				Recurring: false,
				occasionRequest: occasionRequest{
					CloseDate:  time.Date(0, 0, 0, 0, 0, 0, 0, time.UTC),
					Restaurant: s.Restaurant.ID,
				},
			})
			if err == nil {
				t.Errorf("expected query error")
			}
		})
	})
}

func TestDeleteOccasion(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := DeleteOccasionHandler{}

		t.Run("Delete Occasion", func(t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, occasionRequest{
				CloseDate:  s.Occasion.CloseDate,
				Restaurant: s.Restaurant.ID,
			})
			if err != nil {
				t.Errorf("unexpected query error")
			}
		})

		t.Run("Delete Non-Existent Occasion", func(t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, occasionRequest{
				CloseDate:  s.Occasion.CloseDate,
				Restaurant: s.Restaurant.ID,
			})
			if err != nil {
				t.Errorf("unexpected query error")
			}
		})
	})
}
