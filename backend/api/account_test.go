package api

import (
	"bytes"
	"plange/backend/model"
	"slices"
	"testing"

	"gorm.io/gorm"
)

func TestRegisterAccount(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := RegisterAccountHandler{}

		t.Run("Register Account", func(t *testing.T) {
			err := h.handle(s.Ctx, db, "a", [128]byte{}, [256]byte{})
			if err != nil {
				t.Errorf("Unable to register account")
			}
		})
		t.Run("Register Duplicate Account", func(t *testing.T) {
			err := h.handle(s.Ctx, db, "a", [128]byte{}, [256]byte{})
			if err == nil {
				t.Errorf("Expected error, succeded at registering a duplicate email")
			}
		})
	})
}

func TestDeleteAccount(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := DeleteAccountHandler{}

		t.Run("Delete Account", func(t *testing.T) {
			i, err := h.handle(s.Ctx, db, s.Account.Email)
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if i == 0 {
				t.Errorf("Failed to delete account")
			}
			if i > 1 {
				t.Errorf("Deleted too many accounts")
			}
		})
		t.Run("Delete Non-exitant Account", func(t *testing.T) {
			i, err := h.handle(s.Ctx, db, "a")
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if i > 0 {
				t.Errorf("Deleted non-existent account")
			}
		})
	})
}

func TestUpdateAccount(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := UpdateAccountHandler{}

		t.Run("Update Account Email", func(t *testing.T) {
			i, err := h.handle(s.Ctx, db, s.Account.Email, model.Account{
				Email: "a",
			})
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if i == 0 {
				t.Errorf("Failed to update account")
			}
			if i > 1 {
				t.Errorf("Updated too many accounts")
			}

			account, err := gorm.G[model.Account](db).Where("email = ?", "a").Take(s.Ctx)
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if account.Email != "a" {
				t.Errorf("Failed to update account")
			}
			if account.ID != s.Account.ID {
				t.Errorf("Failed to update account")
			}
			if !bytes.Equal(account.PasswordHash, s.Account.PasswordHash) {
				t.Errorf("Failed to update account")
			}
			if !bytes.Equal(account.PasswordSalt, s.Account.PasswordSalt) {
				t.Errorf("Failed to update account")
			}
			// undo the operation, we won't bother checking these
			// results
			_, _ = h.handle(s.Ctx, db, "a", s.Account)
		})
		t.Run("Update Account Password", func(t *testing.T) {
			salt, hash := CreateSaltAndHashPassword("a")
			i, err := h.handle(s.Ctx, db, s.Account.Email, model.Account{
				PasswordSalt: salt[:],
				PasswordHash: hash[:],
			})
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if i == 0 {
				t.Errorf("Failed to update account")
			}
			if i > 1 {
				t.Errorf("Updated too many accounts")
			}

			account, err := gorm.G[model.Account](db).Where("email = ?", s.Account.Email).Take(s.Ctx)
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if account.Email != s.Account.Email {
				t.Errorf("Failed to update account")
			}
			if account.ID != s.Account.ID {
				t.Errorf("Failed to update account")
			}
			if !bytes.Equal(account.PasswordHash, hash[:]) {
				t.Errorf("Failed to update account")
			}
			if !bytes.Equal(account.PasswordSalt, salt[:]) {
				t.Errorf("Failed to update account")
			}
			// undo the operation, we won't bother checking these
			// results
			_, _ = h.handle(s.Ctx, db, s.Account.Email, s.Account)
		})
		t.Run("Update Account All", func(t *testing.T) {
			salt, hash := CreateSaltAndHashPassword("a")
			i, err := h.handle(s.Ctx, db, s.Account.Email, model.Account{
				Email:        "a",
				PasswordSalt: salt[:],
				PasswordHash: hash[:],
			})
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if i == 0 {
				t.Errorf("Failed to update account")
			}
			if i > 1 {
				t.Errorf("Updated too many accounts")
			}

			account, err := gorm.G[model.Account](db).Where("email = ?", "a").Take(s.Ctx)
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if account.Email != "a" {
				t.Errorf("Failed to update account")
			}
			if account.ID != s.Account.ID {
				t.Errorf("Failed to update account")
			}
			if !bytes.Equal(account.PasswordHash, hash[:]) {
				t.Errorf("Failed to update account")
			}
			if !bytes.Equal(account.PasswordSalt, salt[:]) {
				t.Errorf("Failed to update account")
			}
			_, _ = h.handle(s.Ctx, db, "a", s.Account)
		})
		t.Run("Update Non-exitant Account", func(t *testing.T) {
			i, err := h.handle(s.Ctx, db, "a", model.Account{
				Email: "b",
			})
			if err != nil {
				t.Errorf("Unexpected query error")
			}
			if i > 0 {
				t.Errorf("Updated non-existent account")
			}
		})
	})
}

func TestAccountManagedRestaurants(t *testing.T) {
	t.Parallel()
	WithTestDB(t, func(db *gorm.DB) {
		s := SeedDB(db)

		h := AccountManagedRestaurantsHandler{}

		t.Run("Query Restaurants", func(t *testing.T) {
			details, err := h.handle(s.Ctx, db, s.Account.Email)
			if err != nil {
				t.Errorf("Unexpected query error")
			}

			expected := []restaurantDetails{{
				ID:                s.Restaurant.ID,
				Name:              s.Restaurant.Name,
				Description:       s.Restaurant.Description,
				LocationText:      s.Restaurant.LocationText,
				LocationUrl:       s.Restaurant.LocationUrl,
				FrontpageMarkdown: s.Restaurant.FrontpageMarkdown,
			}}
			if !slices.Equal(details, expected) {
				t.Errorf("got %#v, want %#v", details, expected)
			}
		})
		t.Run("Query Non-Existent Account", func(t *testing.T) {
			details, err := h.handle(s.Ctx, db, "a")
			if err != nil {
				t.Errorf("Unexpected query error")
			}

			expected := []restaurantDetails{}
			if !slices.Equal(details, expected) {
				t.Errorf("got %#v, want %#v", details, expected)
			}
		})
	})
}
