# Project overview:
## /backend
go backend code

Oscar and James

our work was heavily joined together,
and we kept each other to similar standards:

/backend/api - code for the api endpoints
/backend/model - code for the sql models in go
/backend/lib - code for using middlware with the std http library
/backend/vite - code for enabling serving the frontend code in dev or prod

## /frontend
react vite project

mainly Matt, Jiaqian and Jayden

/frontend/src/routes - source code for each page

Matt:
/frontend/src/index.css - common css
/frontend/src/routes/-components - reusable components for the whole application
/frontend/src/routes/__root.tsx - application layout code
/frontend/src/routes/index.css - root page css
/frontend/src/routes/restaurants/$restaurantid/make-booking/* - make booking code
/frontend/src/routes/edit-booking/* - edit booking code
/frontend/src/routes/booking/* - edit booking code

James:
/frontend/src/routes/booking/upcoming/* - upcoming bookings code

Jayden:
/frontend/src/routes/index.tsx/ - root page code
/frontend/src/routes/sign-up/* - code for sign-up page
/frontend/src/routes/login/* - code for login page
/frontend/src/routes/restaurants/$id.index.tsx - code for restaurant page

Jiaqian
/frontend/src/routes/account/* - code for account page
/frontend/src/routes/account-setting/* - code for account settings
/frontend/src/routes/booking-setting/* - code for booking settings

## Other:
Most other files are tooling / configuration.

Some of it was auto generated, anything that was written by hand was written by
James or Oscar. (e.g. James did the Dockerfile and compose files, Oscar wrote
the initial Makefile, James wrote the first version of init.sql)

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
`make db` -- run db container
`make frontend-dev` -- run frontend vite dev server
`make dev` -- runs backend go dev server

This will host the server locally at http://localhost:3000 by default. You
should not access the vite (frontend) dev server directly, the go server will
proxy it.

## Other:
`make` -- will run production build by default

`make clean` -- removes local build outputs, stops and removes compose containers
