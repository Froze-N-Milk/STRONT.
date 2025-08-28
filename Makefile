.PHONY: all
all: build

.PHONY: build
build: main

.PHONY: frontend/dist
frontend/dist:
	cd frontend; npm install && npm run build

main: frontend/dist local.db
	go build -o main backend/main.go

.PHONY: frontend-dev
frontend-dev:
	cd frontend; npm install && npm run dev

.PHONY: dev
dev: local.db
	go run -tags dev backend/main.go

.PHONY: run
run: build local.db
	./main

.PHONY: rebuild-db
rebuild-db:
	rm -f local.db
	sqlite3 -init init.sql local.db .quit

local.db:
	sqlite3 -init init.sql local.db .quit

.PHONY: clean
clean:
	go clean
	rm -f local.db
	rm -rf frontend/dist
	rm -rf frontend/node_modules

