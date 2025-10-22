FROM node:22 AS frontend-build

WORKDIR /app/frontend
COPY frontend/ .

RUN npm install

RUN npm run build

FROM golang:1.25.1 AS backend-build

WORKDIR /app

COPY ./go.mod /app
COPY ./go.sum /app
COPY ./embed.go /app
COPY ./backend /app/backend
COPY --from=frontend-build /app/frontend /app/frontend

RUN CGO_ENABLED=0 go build -o /go-app backend/main.go

RUN chown root:root /go-app \
 && chmod +x /go-app

FROM rockylinux/rockylinux:10-minimal AS runner

COPY --from=backend-build /go-app /app/stront

ENTRYPOINT ["/app/stront"]