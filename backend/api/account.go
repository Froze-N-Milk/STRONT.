package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"plange/backend/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RegisterAccountHandler struct {
	JWTKey *[32]byte
}

func (h *RegisterAccountHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	signUp := request{}
	err := json.NewDecoder(r.Body).Decode(&signUp)
	if err != nil {
		slog.Error("invalid sign-up request", "error", err, "request", r.Body)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Pull account matching email
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
