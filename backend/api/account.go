package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"plange/backend/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Creates a new account in the database for the email and password provided
//
// expects: { email: string, password: string, }
//
// bound to: /api/account/register
type RegisterAccountHandler struct {
	JWTKey *[32]byte // 32 byte signing key for jwt session tokens
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

	err = gorm.G[model.Account](ctx.DB.Clauses(clause.OnConflict{DoNothing: true})).Create(r.Context(), &model.Account{
		Email:        signUp.Email,
		PasswordHash: hash[:],
		PasswordSalt: salt[:],
	})

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

// Deletes the currently authenticated account
//
// authed endpoint
//
// bound to: /api/account/delete
type DeleteAccountHandler struct{}

func (h *DeleteAccountHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	i, err := gorm.G[model.Account](ctx.DB).Where("email = ?", ctx.User.Email).Delete(r.Context())
	if err != nil {
		slog.Error("something went wrong", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	// clear all the site data to logout, doesn't matter if the account exists or not
	w.Header().Add("Clear-Site-Data", "*")
	if i == 0 {
		slog.Error("attempt to delete non-existent account", "email", ctx.User.Email)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}

// Updates the email and / or password of the currently authenticated account
//
// authed endpoint
//
// expects: { email: string?, password: string?, }
//
// bound to: /api/account/register
type UpdateAccountHandler struct {
	JWTKey *[32]byte // 32 byte signing key for jwt session tokens
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

	i, err := gorm.G[model.Account](ctx.DB).Where("email = ?", ctx.User.Email).Updates(r.Context(), updatedAccount)

	if err != nil {
		slog.Error("something went wrong", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if i == 0 {
		slog.Error("attempt to update non-existent account", "email", ctx.User.Email)
		// remove site data
		w.Header().Add("Clear-Site-Data", "*")
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
