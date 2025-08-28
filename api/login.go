package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Account struct {
	ID           uuid.UUID `json:"id" gorm:"primary_key;default:gen_random_uuid()"`
	Email        string    `json:"email"`
	PasswordHash []byte    `json:"password_hash" gorm:"type:bytea"`
	PasswordSalt []byte    `json:"password_salt" gorm:"type:bytea"`
}

func (Account) TableName() string {
	return "account"
}

type login struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginHandler struct {
	DB *gorm.DB
}

func (h *LoginHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	login := login{}
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
	w.Header().Add("Set-Cookie", "session=MySessionToken")
	w.Header().Add("Location", fmt.Sprintf("/account/%s", account.ID.String()))
	w.WriteHeader(http.StatusSeeOther)
}
