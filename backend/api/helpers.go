package api

import (
	"net/http"
	"plange/backend/lib"

	"gorm.io/gorm"
)

type AppContext struct {
	DB *gorm.DB
}

// AppMiddleware services an http endpoint to inject database access
type AppMiddleware struct {
	Ctx AppContext
}

func (m *AppMiddleware) Service(h lib.Handler[AppContext]) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(
			m.Ctx,
			w,
			r,
		)
	})
}

// AuthedAppContext combines AppContext with authed user data
type AuthedAppContext struct {
	User User
	AppContext
}

// AuthedAppMiddleware combines AppMiddleware with AuthMiddleware
type AuthedAppMiddleware struct {
	Auth AuthChecker
	Ctx  AppContext
}

func (m *AuthedAppMiddleware) Service(h lib.Handler[AuthedAppContext]) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := m.Auth(w, r)
		if err != nil {
			return
		}
		h.ServeHTTP(
			AuthedAppContext{
				User:       user,
				AppContext: m.Ctx,
			},
			w,
			r,
		)
	})
}
