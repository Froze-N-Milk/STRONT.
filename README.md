# Requirements:
- go
- node
- make

# Commands:

# Building for production
`make build` -- production build, generating `./main`, a single static binary
with the frontend embedded, ready to be deployed.

`make run` -- production build, then run it.

# Development
`make frontend-dev` -- start the frontend dev server

`make dev` -- start the backend dev server

run `make frontend-dev` and then start `make dev` in another shell.

This will host the server locally at http://localhost:3000 by default. You
should not access the vite (frontend) dev server directly, the go server will
proxy it.

# Other:
`make` -- will run production build by default

`make clean` -- removes the build outputs.
