package vite

import (
	"log/slog"
	"net/http"
)

var Adapter ViteAdapter
var IsDev bool

//	type ViteAdapter struct {
//		Mux               *http.ServeMux
//		make_vite_handler func(path string) http.Handler
//	}
//
//	func MakeViteAdapter(make_vite_handler func(path string) http.Handler) ViteAdapter {
//		return ViteAdapter{
//			Mux:               http.NewServeMux(),
//			make_vite_handler: make_vite_handler,
//		}
//	}
type ViteAdapter struct {
	paths             []string
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
func (self ViteAdapter) IntoHandler() *http.ServeMux {
	res := http.NewServeMux()
	res.Handle("/assets/", self.assets)
	for _, path := range self.paths {
		handler := self.make_vite_handler(path)
		res.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			slog.Debug("serve vite", "url", r.URL)
			handler.ServeHTTP(w, r)
		})
	}
	return res
}

//func (self *ViteAdapter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
//	log.Printf("Vite Adapter, request url: %s\n", r.URL)
//	self.Mux.ServeHTTP(w, r)
//}

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
