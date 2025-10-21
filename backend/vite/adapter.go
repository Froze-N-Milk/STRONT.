package vite

import (
	"net/http"
	"plange/backend/api"
	"plange/backend/lib"
)

var Adapter ViteAdapter
var IsDev bool

type titleAndPath struct {
	title string
	path  string
}

type ViteAdapter struct {
	paths                  []titleAndPath
	authedPaths            []titleAndPath
	publicAssetPaths       []string
	assets                 http.Handler
	makeViteHandler        func(title string, path string) http.Handler
	makePublicAssetHandler func(path string) http.Handler
}

func MakeViteAdapter(
	assets http.Handler,
	makeViteHandler func(title string, path string) http.Handler,
	makePublicAssetHandler func(path string) http.Handler,
) ViteAdapter {
	return ViteAdapter{
		assets:                 assets,
		makeViteHandler:        makeViteHandler,
		makePublicAssetHandler: makePublicAssetHandler,
	}
}

func (self *ViteAdapter) AddRoute(title string, path string) {
	self.paths = append(self.paths, titleAndPath{title, path})
}

func (self *ViteAdapter) AddAuthedRoute(title string, path string) {
	self.authedPaths = append(self.authedPaths, titleAndPath{title, path})
}

// register file in /public
func (self *ViteAdapter) AddPublicAsset(path string) {
	self.publicAssetPaths = append(self.publicAssetPaths, path)
}

func (self ViteAdapter) IntoHandler(middleware api.AuthedAppMiddleware) *http.ServeMux {
	res := http.NewServeMux()
	res.Handle("/assets/", self.assets)
	for _, path := range self.publicAssetPaths {
		res.Handle(path, self.makePublicAssetHandler(path))
	}
	for _, titleAndPath := range self.paths {
		res.Handle(titleAndPath.path, self.makeViteHandler(titleAndPath.title, titleAndPath.path))
	}
	for _, titleAndPath := range self.authedPaths {
		h := self.makeViteHandler(titleAndPath.title, titleAndPath.path)
		res.Handle(titleAndPath.path, middleware.Service(lib.HandlerFunc[api.AuthedAppContext](func(ctx api.AuthedAppContext, w http.ResponseWriter, r *http.Request) {
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
	<body>
		<div id="root"></div>
	</body>
</html>
`
