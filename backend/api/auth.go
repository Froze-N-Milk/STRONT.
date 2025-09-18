package api

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"plange/backend/model"

	"gorm.io/gorm"
)

// LoginHandler attempts to log a user in
//
// expects: { email: string, password: string, }
//
// bound to: /api/account/login
type LoginHandler struct {
	JWTKey *[32]byte // 32 byte signing key for jwt session tokens
}

func (h *LoginHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	login := request{}
	err := json.NewDecoder(r.Body).Decode(&login) // Try decoding request to the login object
	if err != nil {                               // If the decode failed, log the error and send status request back
		slog.Error("invalid login request", "error", err, "request", r.Body)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Pull account matching email
	account, err := gorm.G[model.Account](ctx.DB).Where("email = ?", login.Email).First(r.Context())
	if err != nil {
		slog.Error(err.Error())
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	inputPasswordHash := HashPassword(login.Password, [128]byte(account.PasswordSalt))

	// Compare inputPasswordHash (as slice) to account.PasswordHash (already a slice)
	if !bytes.Equal(inputPasswordHash[:], account.PasswordHash) {
		slog.Info("Failed login attempt on " + account.Email)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Return success if match
	err = setSessionToken(w, account.Email, h.JWTKey)
	if err != nil {
		slog.Error("unable to set session cookie", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Add("Location", "/account")
	w.WriteHeader(http.StatusSeeOther)
}

// LogoutHandler logs out the currently authenticated user
//
// authed endpoint
//
// bound to: /api/account/logout
type LogoutHandler struct{}

func (h *LogoutHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	// clear all the site data
	w.Header().Add("Clear-Site-Data", "*")
	w.WriteHeader(http.StatusOK)
}
