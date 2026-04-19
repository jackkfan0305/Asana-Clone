# Asana Clone

> [!IMPORTANT]
> **This repository is deprecated and archived.**
>
> The canonical version now lives at **https://github.com/collinear-ai/Asana-Clone**.
>
> We duplicated it to the Collinear organisation so the rl-gym / clone-task evaluation work has a single source of truth alongside the other clones (`gmail`, `slackdesktop-clone`, `google-docs`, `googlesheetsweb_clone`, `github-clone`, `zendesk-clone`, etc.).
>
> @jackkfan0305 — FYI, this repo is now read-only. If you need to push anything new, please open a PR against [`collinear-ai/Asana-Clone`](https://github.com/collinear-ai/Asana-Clone) or ping @renantrendt on Slack. You've been invited as a `write` collaborator on the new repo.

---

A full-stack Asana clone built as a Docker-packaged training environment for AI agents. Features a FastAPI backend, React + TypeScript frontend, and PostgreSQL database with 95% visual fidelity to Asana's dark-mode UI.

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React 19 + TypeScript + Vite
- **Database:** PostgreSQL (35 tables)
- **Auth:** Session-based fake user system with login, roles, and session management
- **Testing:** pytest
- **Packaging:** Docker Compose (3 services: app, postgres, seed)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+) and npm (for local frontend development)
- [Python 3.11+](https://www.python.org/) (for local backend development)

## Quick Start (Docker)

The fastest way to get everything running:

```bash
# Start PostgreSQL and the backend app
make up

# Seed the database with sample data
make seed
```

The backend API will be available at **http://localhost:8030**.

To stop all services:

```bash
make down
```

## Local Development

For a faster dev loop, run the backend and frontend separately outside Docker.

### 1. Start PostgreSQL

You still need Docker for the database:

```bash
docker compose -f docker-compose.dev.yml up --build -d postgres
```

### 2. Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the backend dev server (auto-reloads on changes)
make dev-backend
```

The backend will start at **http://localhost:8000** with hot reload enabled.

### 3. Frontend

```bash
cd app/frontend/asana-clone

# Install dependencies
npm install

# Run the frontend dev server
npm run dev
```

The frontend dev server will start at **http://localhost:5173** (default Vite port).

### 4. Seed Data

With the database and backend running:

```bash
make seed
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/asana_clone` | PostgreSQL connection string |
| `PORT` | `8030` | Backend server port (Docker) |

## Makefile Commands

| Command | Description |
|---|---|
| `make up` | Start PostgreSQL and backend via Docker Compose |
| `make down` | Stop all Docker services |
| `make seed` | Seed the database with sample data |
| `make reset` | Truncate all tables (reset database) |
| `make dev-backend` | Run backend locally with hot reload (port 8000) |
| `make dev-frontend` | Run frontend locally with Vite dev server |
| `make test` | Run pytest test suite |
| `make lint` | Run ruff (Python) and eslint (TypeScript) linters |
| `make validate` | Run full validation: structure check, lint, and tests |

## Project Structure

```
├── app/
│   ├── server.py          # FastAPI main app (/step, /tools, /health, auth)
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schema.py           # Pydantic schemas
│   ├── db.py               # Database connection setup
│   ├── auth.py             # Authentication & session management
│   ├── audit.py            # Audit logging
│   ├── tools/              # Tool server dispatch (POST /step)
│   ├── seed/               # Database seeding scripts
│   ├── seed_data/          # Seed data files
│   ├── postgres/
│   │   └── init.sql        # Database schema (35 tables)
│   ├── frontend/
│   │   └── asana-clone/    # React + TypeScript + Vite frontend
│   └── tests/              # pytest test suite
├── dockerfiles/            # Dockerfiles for app, postgres, seed
├── docker-compose.dev.yml  # Docker Compose config
├── requirements.txt        # Python dependencies
├── Makefile                # Dev commands
├── SPEC.md                 # Detailed implementation spec
└── FEATURES.md             # Feature list (Tier 1 + Tier 2)
```

## API Endpoints

- `POST /step` — Tool server dispatcher for AI agent interaction
- `GET /tools` — List available tools
- `GET /health` — Health check
- `POST /reset` — Reset database state
- `POST /auth/login` — User login
- `POST /auth/logout` — User logout
- `GET /auth/me` — Get current user
