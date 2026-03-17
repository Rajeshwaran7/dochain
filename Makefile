.PHONY: install dev dev-api dev-patient dev-doctor build docker-up docker-down db-reset help

## ── Local Development ─────────────────────────────────────────────────────
install:
	npm install

dev-api:
	nx serve api

dev-patient:
	nx serve web-patient

dev-doctor:
	nx serve web-doctor

dev:
	@echo "Starting all services in parallel…"
	@npx concurrently \
		"nx serve api" \
		"nx serve web-patient" \
		"nx serve web-doctor" \
		--names "API,PATIENT,DOCTOR" \
		--prefix-colors "cyan,green,magenta"

## ── Database ──────────────────────────────────────────────────────────────
db-up:
	docker-compose up postgres redis -d

db-reset:
	docker-compose down postgres
	docker volume rm dochain_postgres_data || true
	docker-compose up postgres -d

## ── Build ─────────────────────────────────────────────────────────────────
build-api:
	nx build api

build-patient:
	nx build web-patient

build-doctor:
	nx build web-doctor

build:
	nx run-many --target=build --all

## ── Docker ────────────────────────────────────────────────────────────────
docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

## ── Code Quality ──────────────────────────────────────────────────────────
lint:
	nx run-many --target=lint --all

typecheck:
	nx run-many --target=typecheck --all

## ── SSL (local dev self-signed) ───────────────────────────────────────────
ssl-local:
	mkdir -p docker/nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout docker/nginx/ssl/dochain.key \
		-out    docker/nginx/ssl/dochain.crt \
		-subj "/C=IN/ST=TN/L=Chennai/O=Dochain/CN=localhost"

## ── Help ──────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "Dochain — Available commands:"
	@echo ""
	@echo "  make install        Install all npm dependencies"
	@echo "  make dev            Start all apps concurrently"
	@echo "  make dev-api        Start NestJS API only"
	@echo "  make dev-patient    Start patient PWA only"
	@echo "  make dev-doctor     Start doctor PWA only"
	@echo "  make db-up          Start PostgreSQL + Redis"
	@echo "  make db-reset       Wipe and recreate database"
	@echo "  make build          Build all apps for production"
	@echo "  make docker-up      Build & start full Docker stack"
	@echo "  make docker-down    Stop Docker stack"
	@echo "  make docker-logs    Tail Docker logs"
	@echo "  make ssl-local      Generate self-signed SSL for dev"
	@echo "  make lint           Lint all apps"
	@echo ""
