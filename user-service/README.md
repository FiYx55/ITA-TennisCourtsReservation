# User Service

Handles user management, profiles, and identity verification.

## Technology

- **Language**: C#
- **Framework**: .NET 9
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

## Running Tests

```bash
cd user-service
dotnet test
```

Tests use an in-memory database, no external dependencies needed.

GitHub Actions runs the tests automatically on every push to `user-service/` or `proto/`.

## Running with Docker

```bash
docker compose up user-service
```

## gRPC UI

A web-based GUI for testing gRPC methods (like Swagger for REST) is available via Docker Compose:

```bash
docker compose up user-service grpcui
```

Then open [http://localhost:2005](http://localhost:2005) in your browser. You'll see a dropdown with all available gRPC methods (`GetUsers`, `GetUser`, `CreateUser`, `UpdateUser`, `DeleteUser`, `VerifyUser`) where you can fill in request fields and invoke them.
