# Court Service

Manages the catalog of tennis courts, their properties, and availability statuses.

## Technology

- **Language**: Python
- **Framework**: FastAPI
- **Interface**: REST API
- **Database**: PostgreSQL (`courts_db`)

## Description

The court service maintains court entities — surface type, location, and maintenance-related occupancy. The API Gateway forwards court-related REST requests here.

## Environment Variables

| Variable            | Description              | Default     |
|---------------------|--------------------------|-------------|
| `DATABASE_HOST`     | PostgreSQL host          | `postgres`  |
| `DATABASE_PORT`     | PostgreSQL port          | `5432`      |
| `DATABASE_NAME`     | Database name            | `courts_db` |
| `DATABASE_USER`     | Database user            | `postgres`  |
| `DATABASE_PASSWORD` | Database password        | `postgres`  |
| `APP_PORT`          | HTTP listen port         | `8000`      |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 8000 | HTTP     | REST API    |

## Running with Docker

```bash
docker compose up court-service
```
