package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/olivere/vite"
)

//go:embed all:frontend/dist
var distFS embed.FS

func DistFS() fs.FS {
	efs, err := fs.Sub(distFS, "frontend/dist")
	if err != nil {
		panic(fmt.Sprintf("unable to serve frontend: %v", err))
	}

	return efs
}

func main() {
	isDev := flag.Bool("dev", false, "run in development mode")
	port := flag.Int("port", 3000, "http port")
	flag.Parse()

	var mux *http.ServeMux
	if *isDev {
		mux = MakeDevServer()
	} else {
		mux = MakeProdServer()
	}

	server := http.Server{
		Addr:    fmt.Sprintf("localhost:%d", *port),
		Handler: mux,
	}

	log.Printf("Listening on on http://%s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}

func MakeDevServer() *http.ServeMux {
	viteHandler, err := vite.NewHandler(vite.Config{
		FS:       os.DirFS("./frontend"),
		IsDev:    true,
		PublicFS: os.DirFS("./frontend/public"),
		ViteURL:  "http://localhost:5173",
	})
	if err != nil {
		panic(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", viteHandler)
	return mux
}

func MakeProdServer() *http.ServeMux {
	viteHandler, err := vite.NewHandler(vite.Config{
		FS:    DistFS(),
		IsDev: false,
	})
	if err != nil {
		panic(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", viteHandler)
	return mux
}
