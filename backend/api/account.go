package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"plange/backend/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// RegisterAccountHandler creates a new account in the database for the email and password provided
//
// expects: { email: string, password: string, }
//
// redirects to /account on success
//
// bound to: POST /api/account/register
type RegisterAccountHandler struct {
	JWTKey *[32]byte // 32 byte signing key for jwt session tokens
}

func (*RegisterAccountHandler) handle(ctx context.Context, db *gorm.DB, email string, salt [128]byte, hash [256]byte) error {
	return gorm.G[model.Account](db.Clauses(clause.OnConflict{DoNothing: true})).Create(ctx, &model.Account{
		Email:        email,
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	})
}

func (h *RegisterAccountHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	signUp := request{}
	err := json.NewDecoder(r.Body).Decode(&signUp)
	if err != nil || signUp.Email == "" || signUp.Password == "" {
		slog.Error("invalid sign-up request", "error", err, "request", r.Body)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	salt, hash := CreateSaltAndHashPassword(signUp.Password)

	err = h.handle(r.Context(), ctx.DB, signUp.Email, salt, hash)

	if err != nil {
		slog.Error("account already exists for email", "email", signUp.Email, "error", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// TODO: verify email

	// set session cookie
	err = setSessionToken(w, signUp.Email, h.JWTKey)
	if err != nil {
		slog.Error("unable to set session cookie", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Add("Location", "/account")
	w.WriteHeader(http.StatusSeeOther)
}

// DeleteAccountHandler deletes the currently authenticated account
//
// authed endpoint
//
// bound to: POST /api/account/delete
type DeleteAccountHandler struct{}

func (*DeleteAccountHandler) handle(ctx context.Context, db *gorm.DB, email string) (int, error) {
	return gorm.G[model.Account](db).Where("email = ?", email).Delete(ctx)
}

func (h *DeleteAccountHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	i, err := h.handle(r.Context(), ctx.DB, ctx.User.Email)
	if err != nil {
		slog.Error("something went wrong", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	// clear all the site data to logout, doesn't matter if the account exists or not
	setSessionTokenCookie(w, "")
	w.Header().Add("Clear-Site-Data", "\"*\"")
	if i == 0 {
		slog.Error("attempt to delete non-existent account", "email", ctx.User.Email)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}

// UpdateAccountHandler updates the email and / or password of the currently authenticated account
//
// authed endpoint
//
// expects: { email: string?, password: string?, }
//
// bound to: POST /api/account/register
type UpdateAccountHandler struct {
	JWTKey *[32]byte // 32 byte signing key for jwt session tokens
}

func (*UpdateAccountHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	email string,
	account model.Account,
) (int, error) {
	return gorm.G[model.Account](db).Where("email = ?", email).Updates(ctx, account)
}

func (h *UpdateAccountHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	accountDetails := request{}
	err := json.NewDecoder(r.Body).Decode(&accountDetails)

	if err != nil || (accountDetails.Email == "" && accountDetails.Password == "") {
		slog.Error("invalid edit-account request", "error", err, "request", r.Body)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	updatedAccount := model.Account{}

	if accountDetails.Email != "" {
		updatedAccount.Email = accountDetails.Email
	}

	// only true if there is a new password value
	// TODO: reject passwords that do not match a length requirement
	if accountDetails.Password != "" {
		// create new salt and hash, reusing the old values would be insecure
		salt, hash := CreateSaltAndHashPassword(accountDetails.Password)
		updatedAccount.PasswordHash = hash[:]
		updatedAccount.PasswordSalt = salt[:]
	}

	i, err := h.handle(r.Context(), ctx.DB, ctx.User.Email, updatedAccount)

	if err != nil {
		slog.Error("something went wrong", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if i == 0 {
		slog.Error("attempt to update non-existent account", "email", ctx.User.Email)
		// remove site data
		setSessionTokenCookie(w, "")
		w.Header().Add("Clear-Site-Data", "\"*\"")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// if we've updated the email, re-issue the session cookie
	if updatedAccount.Email != "" {
		// remove the old cookie re-issue if it exists
		w.Header().Del("Set-Cookie")
		setSessionToken(w, updatedAccount.Email, h.JWTKey)
	}
}

// AccountManagedRestaurantsHandler fetches the the restaurants owned by the
// currently authenticated user
//
// authed endpoint
//
//	returns: {
//		id: string,
//		name: string,
//		description: string,
//		locationText: string,
//		locationUrl: string,
//		frontpageMarkdown: string,
//	}[]
//
// bound to: GET /api/account/restaurants
type AccountManagedRestaurantsHandler struct{}

func (*AccountManagedRestaurantsHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	email string,
) ([]restaurantDetails, error) {
	restaurants, err := gorm.G[model.Restaurant](db).Raw(`
SELECT
	restaurant.id,
	restaurant.name,
	restaurant.description,
	restaurant.location_text,
	restaurant.location_url,
	restaurant.frontpage_markdown
FROM restaurant
INNER JOIN account
	ON account.email = ?
	AND restaurant.account_id = account.id`,
		email).Find(ctx)

	if err != nil {
		return nil, err
	}

	res := make([]restaurantDetails, len(restaurants))
	for i, restaurant := range restaurants {
		res[i] = restaurantDetails{
			ID:                restaurant.ID,
			Name:              restaurant.Name,
			Description:       restaurant.Description,
			LocationText:      restaurant.LocationText,
			LocationUrl:       restaurant.LocationUrl,
			FrontpageMarkdown: restaurant.FrontpageMarkdown,
		}
	}

	return res, nil
}

func (h *AccountManagedRestaurantsHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	restaurants, err := h.handle(r.Context(), ctx.DB, ctx.User.Email)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(&restaurants)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
