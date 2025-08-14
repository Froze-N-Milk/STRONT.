.PHONY: all
all: build

.PHONY: build
build: main

frontend/dist:
	rm -rf frontend/dist
	cd frontend; npm install && npm run build

main: frontend/dist
	go build -o main main.go

.PHONY: frontend-dev
frontend-dev:
	cd frontend; npm install && npm run dev

.PHONY: dev
dev: local.db
	mkdir -p frontend/dist
	touch frontend/dist/.marker
	go run main.go --dev

.PHONY: run
run: build local.db
	./main

local.db:
	sqlite3 -init init.sql local.db .quit

.PHONY: clean
clean:
	go clean
	rm -f local.db
	rm -rf frontend/dist

