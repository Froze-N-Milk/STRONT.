# Requirements:
- go
- node
- make
- docker compose (podman-compose does not work for this)

# Commands:

## Building for production
`make build` -- builds all compose stages

`make run` -- runs the production compose configuration (embedded web app)

## Development
`make dev` -- runs the dev compose configuration (separate front-end and back-end containers)

This will host the server locally at http://localhost:3000 by default. You
should not access the vite (frontend) dev server directly, the go server will
proxy it.

## Other:
`make` -- will run production build by default

`make clean` -- removes local build outputs, stops and removes compose containers
