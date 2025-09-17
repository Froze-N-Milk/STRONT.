package lib

import "net/http"

type Handler[CTX any] interface {
	ServeHTTP(ctx CTX, w http.ResponseWriter, r *http.Request)
}
type HandlerFunc[CTX any] func(ctx CTX, w http.ResponseWriter, r *http.Request)

func (h HandlerFunc[CTX]) ServeHTTP(ctx CTX, w http.ResponseWriter, r *http.Request) {
	h(ctx, w, r)
}

type Middleware[CTX any] interface {
	Service(Handler[CTX]) http.Handler
}
type MiddlewareFunc[CTX any] func(Handler[CTX]) http.Handler

func (m MiddlewareFunc[CTX]) Service(h Handler[CTX]) http.Handler {
	return m(h)
}

type ServeMux[CTX any] struct {
	middleware Middleware[CTX]
	mux        *http.ServeMux
}

func NewServeMux[CTX any] (middleware Middleware[CTX]) ServeMux[CTX] {
	return ServeMux[CTX] {
		middleware,
		http.NewServeMux(),
	}
}

func BindServeMux[CTX any] (mux *http.ServeMux, middleware Middleware[CTX]) ServeMux[CTX] {
	return ServeMux[CTX] {
		middleware,
		mux,
	}
}

func (h *ServeMux[CTX]) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.mux.ServeHTTP(w, r)
}

func (mux *ServeMux[CTX]) Handle(pattern string, h Handler[CTX]) {
	mux.mux.Handle(pattern, mux.middleware.Service(h))
}

func (mux *ServeMux[CTX]) HandleFunc(pattern string, h HandlerFunc[CTX]) {
	mux.mux.Handle(pattern, mux.middleware.Service(h))
}

