# User Service

Handles user management, profiles, and identity verification.

## Technology

- **Language**: C#
- **Framework**: .NET 8
- **Interface**: gRPC Server
- **Database**: PostgreSQL (`users_db`)

## Description

The user service manages user entities — registration, profiles, and authentication. Other services call it via gRPC to verify user identity (e.g., the reservation-service validates a user before creating a booking).

## Environment Variables

| Variable            | Description              | Default     |
|---------------------|--------------------------|-------------|
| `DATABASE_HOST`     | PostgreSQL host          | `postgres`  |
| `DATABASE_PORT`     | PostgreSQL port          | `5432`      |
| `DATABASE_NAME`     | Database name            | `users_db`  |
| `DATABASE_USER`     | Database user            | `postgres`  |
| `DATABASE_PASSWORD` | Database password        | `postgres`  |
| `GRPC_PORT`         | gRPC listen port         | `50051`     |

## Ports

| Port  | Protocol | Description  |
|-------|----------|--------------|
| 50051 | gRPC     | gRPC Server  |

## Running with Docker

```bash
docker compose up user-service
```
