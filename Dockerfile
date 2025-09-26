FROM node:22 as frontend-build

WORKDIR /app/frontend
COPY frontend/ .

RUN npm install

RUN npm run build

FROM golang:1.25.1 as backend-build

WORKDIR /app

COPY ./go.mod /app
COPY ./go.sum /app
COPY ./embed.go /app
COPY ./backend /app/backend
COPY --from=frontend-build /app/frontend /app/frontend

RUN CGO_ENABLED=0 go test ./...
RUN CGO_ENABLED=0 go build -o /go-app backend/main.go

RUN chown root:root /go-app \
 && chmod +x /go-app

FROM scratch as stront

COPY --from=rockylinux:9-minimal /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=backend-build /go-app /app/stront

ENTRYPOINT ["/app/stront"]

FROM node:22 as frontend-run

WORKDIR /app/frontend

COPY ./frontend/*.* ./

RUN npm install

ENTRYPOINT ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM golang:1.25.1 as backend-run

WORKDIR /app

COPY ./go.mod /app
COPY ./go.sum /app

ENTRYPOINT ["go", "run", "-tags", "dev", "/app/backend/main.go"]