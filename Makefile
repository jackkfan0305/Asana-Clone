.PHONY: up down seed reset test test-e2e dev-backend dev-frontend desktop-dev desktop validate lint

up:
	docker compose -f docker-compose.dev.yml up --build -d postgres app

down:
	docker compose -f docker-compose.dev.yml down

seed:
	docker compose -f docker-compose.dev.yml run --rm seed

reset:
	docker compose -f docker-compose.dev.yml exec app python -c "import requests; requests.post('http://localhost:8030/reset')" || \
	docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d asana_clone -c "DO \$$\$$ DECLARE t text; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(t) || ' CASCADE'; END LOOP; END \$$\$$;"

test:
	pytest app/tests/ -v
	cd app/frontend/asana-clone && npx playwright test

test-e2e:
	cd app/frontend/asana-clone && npx playwright test

dev-backend:
	cd app && uvicorn server:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd app/frontend/asana-clone && npm run dev

desktop-dev:
	@echo "Electron not yet configured. Add electron dependencies and scripts to app/frontend/asana-clone/package.json first."
	@exit 1

desktop:
	@echo "Electron not yet configured. Add electron dependencies and scripts to app/frontend/asana-clone/package.json first."
	@exit 1

validate:
	@echo "=== Checking repo structure ==="
	test -f FEATURES.md
	test -f app/postgres/init.sql
	test -f app/server.py
	test -f app/models.py
	test -f app/schema.py
	test -f app/seed/seed_app.py
	test -d app/frontend/asana-clone/src
	test -d app/tests
	@echo "=== Linting ==="
	ruff check app/ --select E,W,F
	cd app/frontend/asana-clone && npx tsc --noEmit
	cd app/frontend/asana-clone && npx eslint src/ --max-warnings 0
	@echo "=== Tests ==="
	pytest app/tests/ -v
	@echo "=== All checks passed ==="

lint:
	ruff check app/ && cd app/frontend/asana-clone && npx eslint src/
