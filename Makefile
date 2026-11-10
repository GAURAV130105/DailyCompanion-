# Student Life OS — Makefile shortcuts
# Usage: make <target>

.PHONY: help dev stop migrate shell test lint

help:
	@echo "Available commands:"
	@echo "  make dev         - Start all services (Docker Compose)"
	@echo "  make stop        - Stop all services"
	@echo "  make migrate     - Run Django migrations"
	@echo "  make shell       - Open Django shell"
	@echo "  make test-be     - Run backend tests (pytest)"
	@echo "  make test-fe     - Run frontend tests (vitest)"
	@echo "  make lint        - Run linters"
	@echo "  make superuser   - Create Django superuser"

dev:
	docker-compose up --build

dev-bg:
	docker-compose up --build -d

stop:
	docker-compose down

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

shell:
	docker-compose exec backend python manage.py shell

superuser:
	docker-compose exec backend python manage.py createsuperuser

test-be:
	docker-compose exec backend pytest -v

test-fe:
	cd frontend && npm run test

lint:
	cd backend && ruff check . && black --check .
	cd frontend && npm run lint

logs-be:
	docker-compose logs -f backend

logs-fe:
	docker-compose logs -f frontend

clean:
	docker-compose down -v --remove-orphans
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find backend -name "*.pyc" -delete 2>/dev/null; true
