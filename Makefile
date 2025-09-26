ifndef CONTAINER_RUNTIME
	ifneq ($(shell command -v docker 2>/dev/null),)
		CONTAINER_RUNTIME := docker
	else ifneq ($(shell command -v podman 2>/dev/null),)
		CONTAINER_RUNTIME := podman
	else
		$(shell echo "No container runtime installed! Please install docker or podman")
	endif
endif

.PHONY: all
all: build

.PHONY: build
build: main

.PHONY: frontend/dist
frontend/dist:
	cd frontend; npm install && npm run build

main: frontend/dist
	go build -o main backend/main.go

.PHONY: test
test:
	go test -v ./...
	cd frontend; npm install && npm run test

.PHONY: frontend-dev
frontend-dev:
	cd frontend; npm install && npm run dev

.PHONY: dev
dev: db
	go run -tags dev backend/main.go

.PHONY: run
run: build db
	./main

.PHONY: rebuild-db
rebuild-db:
	$(CONTAINER_RUNTIME) compose down
	$(CONTAINER_RUNTIME) compose up --detach

.PHONY: db
db:
	$(CONTAINER_RUNTIME) compose up --detach

.PHONY: clean
clean:
	go clean
	$(CONTAINER_RUNTIME) compose down
	rm -rf frontend/dist
	rm -rf frontend/node_modules

