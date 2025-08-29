package api

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"

	"gorm.io/gorm"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginHandler struct {
	DB *gorm.DB
}

func (h *LoginHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	login := loginRequest{}
	err := json.NewDecoder(r.Body).Decode(&login) // Try decoding request to the login object
	if err != nil {                               // If the decode failed, log the error and send status request back
		slog.Error(err.Error())
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Pull account matching email
	account, err := gorm.G[Account](h.DB).Where("email = ?", login.Email).First(r.Context())
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
	// TODO: Generate session tokens
	w.Header().Add("Set-Cookie", "session=MySessionToken; HttpOnly; SameSite=Strict; Secure; Partitioned")
	w.Header().Add("Location", "/account")
	w.WriteHeader(http.StatusSeeOther)
}
