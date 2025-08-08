.PHONY: all
all: build

.PHONY: build
build: main

frontend/dist:
	cd frontend; npm install && npm run build

main: frontend/dist
	go build -o main main.go

.PHONY: frontend-dev
frontend-dev:
	cd frontend; npm install && npm run dev

.PHONY: dev
dev:
	go run main.go --dev

.PHONY: run
run: build
	./main

.PHONY: clean
clean:
	go clean
	rm -r frontend/dist

