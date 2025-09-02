package api

import (
	"net/http"
	"plange/backend/lib"

	"gorm.io/gorm"
)

type AppContext struct {
	DB *gorm.DB
}

type AppMiddleware struct {
	DB DBMiddleware
}

func (m *AppMiddleware) Service(h lib.Handler[AppContext]) http.Handler {
	return m.DB.Service(lib.HandlerFunc[*gorm.DB](func(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(
			AppContext{db},
			w,
			r,
		)
	}))
}

type AuthedAppContext struct {
	User User
	AppContext
}

type AuthedAppMiddleware struct {
	Auth AuthMiddleware
	AppMiddleware
}

func (m *AuthedAppMiddleware) Service(h lib.Handler[AuthedAppContext]) http.Handler {
	return m.Auth.Service(lib.HandlerFunc[User](func(user User, w http.ResponseWriter, r *http.Request) {
		ctx := AuthedAppContext{}
		ctx.User = user
		m.AppMiddleware.Service(lib.HandlerFunc[AppContext](func(appContext AppContext, w http.ResponseWriter, r *http.Request) {
			ctx.AppContext = appContext
			h.ServeHTTP(ctx, w, r)
		})).ServeHTTP(w, r)
	}))
}
