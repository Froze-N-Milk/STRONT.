package api

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type request struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginHandler struct {
	JWTKey *[32]byte
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
	account, err := gorm.G[Account](ctx.DB).Where("email = ?", login.Email).First(r.Context())
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

type SignUpHandler struct {
	JWTKey *[32]byte
}

func (h *SignUpHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	signUp := request{}
	err := json.NewDecoder(r.Body).Decode(&signUp)
	if err != nil {
		slog.Error("invalid sign-up request", "error", err, "request", r.Body)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Pull account matching email
	salt, hash := CreateSaltAndHashPassword(signUp.Password)

	err = gorm.G[Account](ctx.DB.Clauses(clause.OnConflict{DoNothing: true})).Create(r.Context(), &Account{
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
