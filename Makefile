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

.PHONY: test-db
test-db:
	$(CONTAINER_RUNTIME) stop test-db || true # make sure it's stopped before trying to start it again.
	$(CONTAINER_RUNTIME) run --rm -d --name test-db \
    	-v ./init.sql:/docker-entrypoint-initdb.d/init.sql \
    	-e POSTGRES_DB=stront_template \
    	-e POSTGRES_USER=admin \
    	-e POSTGRES_PASSWORD=test \
    	-p 6543:5432 postgres:latest

.PHONY: wait-test-db
wait-test-db:
	@until $(CONTAINER_RUNTIME) exec test-db pg_isready -U admin -d postgres; do \
		sleep 1; \
	done

.PHONY: test
test: test-db wait-test-db
	DB_HOST="localhost" \
	DB_USER="admin" \
	DB_PASSWORD="test" \
	DB_PORT="6543" \
	go run gotest.tools/gotestsum@latest --format=testname --junitfile test-results.xml --packages="./backend/api/... ./backend/lib/... ./backend/model/..."
	cd frontend; npm i && npm run test
	$(CONTAINER_RUNTIME) stop test-db

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
