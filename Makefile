include .env
export

# ─── Docker Compose ──────────────────────────────────────────────
.PHONY: up down restart logs ps build

up: ## Start all services
	docker compose up -d

up-build: ## Rebuild and start all services
	docker compose up -d --build

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Tail logs for all services
	docker compose logs -f

ps: ## Show running services
	docker compose ps

build: ## Build all Docker images
	docker compose build

# ─── Individual Services ─────────────────────────────────────────
.PHONY: up-mongo up-site-api up-admin-api up-site-app up-admin-app up-nginx

up-mongo: ## Start MongoDB
	docker compose up -d mongo

up-site-api: ## Start site-api
	docker compose up -d site-api

up-admin-api: ## Start admin-api
	docker compose up -d admin-api

up-site-app: ## Start site-app
	docker compose up -d site-app

up-admin-app: ## Start admin-app
	docker compose up -d admin-app

up-nginx: ## Start nginx
	docker compose up -d nginx

# ─── Service Logs ────────────────────────────────────────────────
.PHONY: logs-mongo logs-site-api logs-admin-api logs-site-app logs-admin-app logs-nginx

logs-mongo: ## Tail MongoDB logs
	docker compose logs -f mongo

logs-site-api: ## Tail site-api logs
	docker compose logs -f site-api

logs-admin-api: ## Tail admin-api logs
	docker compose logs -f admin-api

logs-site-app: ## Tail site-app logs
	docker compose logs -f site-app

logs-admin-app: ## Tail admin-app logs
	docker compose logs -f admin-app

logs-nginx: ## Tail nginx logs
	docker compose logs -f nginx

# ─── Local Dev (no Docker) ───────────────────────────────────────
.PHONY: dev-site-api dev-admin-api dev-site-app dev-admin-app dev-seed

dev-site-api: ## Run site-api locally (requires Go, MongoDB on localhost)
	cd backend && MONGO_URI=mongodb://kidtube:kidtube_dev@localhost:27017/kidtube?authSource=admin \
		PORT=8081 \
		JWT_SECRET=$${JWT_SECRET} \
		go run ./cmd/site-api

dev-admin-api: ## Run admin-api locally (requires Go, MongoDB on localhost, ffmpeg, yt-dlp)
	cd backend && MONGO_URI=mongodb://kidtube:kidtube_dev@localhost:27017/kidtube?authSource=admin \
		PORT=8082 \
		JWT_SECRET=$${JWT_SECRET} \
		HLS_ROOT=../data/hls \
		go run ./cmd/admin-api

dev-site-app: ## Run site-app locally (requires Node.js)
	cd site-app && SITE_API_INTERNAL_URL=http://localhost:8081 \
		JWT_SECRET=$${JWT_SECRET} \
		npm run dev

dev-admin-app: ## Run admin-app locally (requires Node.js)
	cd admin-app && ADMIN_API_INTERNAL_URL=http://localhost:8082 \
		npm run dev -- -p 3001

dev-seed: ## Seed the database with admin user
	cd backend && MONGO_URI=mongodb://kidtube:kidtube_dev@localhost:27017/kidtube?authSource=admin \
		ADMIN_EMAIL=$${ADMIN_EMAIL} \
		ADMIN_PASSWORD=$${ADMIN_PASSWORD} \
		go run ./cmd/seed

# ─── Install Dependencies ────────────────────────────────────────
.PHONY: install install-site-app install-admin-app

install: install-site-app install-admin-app ## Install all frontend dependencies

install-site-app: ## Install site-app dependencies
	cd site-app && npm install

install-admin-app: ## Install admin-app dependencies
	cd admin-app && npm install

# ─── Database ─────────────────────────────────────────────────────
.PHONY: db-shell db-reset

db-shell: ## Open MongoDB shell
	docker compose exec mongo mongosh -u $(MONGO_INITDB_ROOT_USERNAME) -p $(MONGO_INITDB_ROOT_PASSWORD)

db-reset: ## Reset database (destroy volume and re-init)
	docker compose down -v
	docker compose up -d mongo
	@echo "Waiting for MongoDB to initialize..."
	@sleep 5
	docker compose up -d

seed: ## Seed admin user via Docker
	docker compose exec -e ADMIN_EMAIL=$${ADMIN_EMAIL} -e ADMIN_PASSWORD=$${ADMIN_PASSWORD} admin-api /bin/seed

# ─── Cleanup ──────────────────────────────────────────────────────
.PHONY: clean clean-volumes

clean: ## Stop services and remove containers/images
	docker compose down --rmi local

clean-volumes: ## Stop services and remove everything including volumes
	docker compose down -v --rmi local

# ─── Help ─────────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sed 's/^[^:]*://' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
