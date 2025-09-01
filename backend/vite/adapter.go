package vite

import (
	"net/http"
	"plange/backend/api"
	"plange/backend/lib"
)

var Adapter ViteAdapter
var IsDev bool

type ViteAdapter struct {
	paths             []string
	authedPaths       []string
	assets            http.Handler
	make_vite_handler func(path string) http.Handler
}

func MakeViteAdapter(assets http.Handler, make_vite_handler func(path string) http.Handler) ViteAdapter {
	return ViteAdapter{
		assets:            assets,
		make_vite_handler: make_vite_handler,
	}
}

func (self *ViteAdapter) AddRoute(path string) {
	self.paths = append(self.paths, path)
}

func (self *ViteAdapter) AddAuthedRoute(path string) {
	self.authedPaths = append(self.authedPaths, path)
}

func (self ViteAdapter) IntoHandler(middleware api.AuthMiddleware) *http.ServeMux {
	res := http.NewServeMux()
	res.Handle("/assets/", self.assets)
	for _, path := range self.paths {
		res.Handle(path, self.make_vite_handler(path))
	}
	for _, path := range self.authedPaths {
		h := self.make_vite_handler(path)
		res.Handle(path, middleware.Service(lib.HandlerFunc[api.User](func(ctx api.User, w http.ResponseWriter, r *http.Request) {
			h.ServeHTTP(w, r)
		})))
	}
	return res
}

var indexTmpl = `
<!doctype html>
<html lang="en" class="h-full scroll-smooth">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/svg+xml" href="/vite.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>{{ .Title }}</title>
		{{ .Vite.Tags }}
	</head>
	<body class="min-h-screen antialiased">
		<div id="root"></div>
	</body>
</html>
`
