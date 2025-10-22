package api

import (
	"slices"
	"testing"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestCreateRestaurant(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := CreateRestaurantHandler{}

		t.Run("Create Restaurant", func(t *testing.T) {
			_, err := h.handle(s.Ctx, db, s.Account.Email, createRestaurantRequest{
				Name:            "A",
				MaxPartySize:    5,
				BookingCapacity: 60,
				BookingLength:   3,
			})
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}
		})
	})
}

func TestUpdateRestaurant(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := UpdateRestaurantHandler{}

		t.Run("Update Restaurant", func(t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, restaurantDetails{
				ID:                s.Restaurant.ID,
				Name:              "",
				Email:             "",
				Phone:             "",
				Description:       "",
				LocationText:      "",
				LocationUrl:       "",
				FrontpageMarkdown: "",
				MaxPartySize:      1,
				BookingCapacity:   1,
				BookingLength:     1,
				Tags:              []string{"updated", "new and fresh"},
			})
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}
		})

		t.Run("Update Non-Existent Restaurant", func(t *testing.T) {
			err := h.handle(s.Ctx, db, s.Account.Email, restaurantDetails{
				ID:                uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
				Name:              "",
				Email:             "",
				Phone:             "",
				Description:       "",
				LocationText:      "",
				LocationUrl:       "",
				FrontpageMarkdown: "",
				MaxPartySize:      1,
				BookingCapacity:   1,
				BookingLength:     1,
				Tags:              []string{""},
			})
			if err == nil {
				t.Errorf("expected query error")
			}
		})
	})
}

func TestDeleteRestaurant(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		create := CreateRestaurantHandler{}
		h := DeleteRestaurantHandler{}

		t.Run("Delete Restaurant", func(t *testing.T) {
			r, err := create.handle(s.Ctx, db, s.Account.Email, createRestaurantRequest{
				Name:            "A",
				MaxPartySize:    5,
				BookingCapacity: 60,
				BookingLength:   3,
			})
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}

			err = h.handle(s.Ctx, db, s.Account.Email, r.ID)
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}
		})

		t.Run("Delete Non-Existent Restaurant", func(t *testing.T) {
			err := h.handle(
				s.Ctx,
				db,
				s.Account.Email,
				uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
			)
			if err != nil {
				t.Errorf("unexpected query error")
			}
		})

		t.Run("Delete Un-Authed Restaurant", func(t *testing.T) {
			err := h.handle(
				s.Ctx,
				db,
				"a",
				s.Restaurant.ID,
			)
			if err != nil {
				t.Errorf("unexpected query error")
			}
		})
	})
}

func TestBrowseRestaurants(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := BrowseRestaurantsHandler{}

		restaurants, err := h.handle(s.Ctx, db)
		if err != nil {
			t.Errorf("unexpected query error: %v", err)
		}
		expected := restaurantDetails{
			ID:                s.Restaurant.ID,
			Name:              s.Restaurant.Name,
			Email:             s.Restaurant.Email,
			Phone:             s.Restaurant.Phone,
			Description:       s.Restaurant.Description,
			LocationText:      s.Restaurant.LocationText,
			LocationUrl:       s.Restaurant.LocationUrl,
			FrontpageMarkdown: s.Restaurant.FrontpageMarkdown,
			MaxPartySize:      s.Restaurant.MaxPartySize,
			BookingCapacity:   s.Restaurant.BookingCapacity,
			BookingLength:     s.Restaurant.BookingLength,
		}

		if !slices.ContainsFunc(restaurants, func(r restaurantDetails) bool {
			return r.Equal(expected)
		}) {
			t.Errorf("expected %#v in result, got %#v, which didn't contain it", expected, restaurants)
		}
	})
}

func TestRestaurantDetails(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := RestaurantDetailsHandler{}

		t.Run("Restaurant Details", func(t *testing.T) {
			details, err := h.handle(s.Ctx, db, s.Restaurant.ID)
			if err != nil {
				t.Errorf("unexpected query error: %v", err)
			}
			expected := restaurantDetails{
				ID:                s.Restaurant.ID,
				Name:              s.Restaurant.Name,
				Email:             s.Restaurant.Email,
				Phone:             s.Restaurant.Phone,
				Description:       s.Restaurant.Description,
				LocationText:      s.Restaurant.LocationText,
				LocationUrl:       s.Restaurant.LocationUrl,
				FrontpageMarkdown: s.Restaurant.FrontpageMarkdown,
				MaxPartySize:      s.Restaurant.MaxPartySize,
				BookingCapacity:   s.Restaurant.BookingCapacity,
				BookingLength:     s.Restaurant.BookingLength,
			}
			if !expected.Equal(details) {
				t.Errorf("expected %#v, got %#v", expected, details)
			}
		})

		t.Run("Non-Existent Restaurant Details", func(t *testing.T) {
			_, err := h.handle(s.Ctx, db, uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"))
			if err == nil {
				t.Errorf("expected query error")
			}
		})
	})
}
