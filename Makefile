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
build:
	$(CONTAINER_RUNTIME) compose build --no-cache

# TODO: Containerise and update the test command
.PHONY: test
test:
	$(CONTAINER_RUNTIME) build -t stront --target backend-build --build-arg CACHE_BUSTER=$(date +%s) .

.PHONY: db
db:
	$(CONTAINER_RUNTIME) compose up db --detach

.PHONY: run
run:
	$(CONTAINER_RUNTIME) compose up

.PHONY: frontend-dev
frontend-dev:
	cd frontend; npm run dev

.PHONY: dev
dev: db
	DB_CONNECTION_STRING="host=localhost user=admin password=password dbname=restaurant_db port=5432 sslmode=disable TimeZone=Australia/Sydney" \
	HOST_STRING="localhost:3000" \
	go run -tags dev ./backend/main.go

.PHONY: clean
clean:
	go clean
	$(CONTAINER_RUNTIME) compose down
	rm -rf frontend/dist
	rm -rf frontend/node_modules
