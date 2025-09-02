package api

import (
	"net/http"
	"plange/backend/lib"

	"gorm.io/gorm"
)

type DBMiddleware struct {
	DB *gorm.DB
}

func (m *DBMiddleware) Service(h lib.Handler[*gorm.DB]) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(m.DB, w, r)
	})
}
