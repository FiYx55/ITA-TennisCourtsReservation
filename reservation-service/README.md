# Reservation Service

Handles the booking logic, linking users to courts with time slots.

## Technology

- **Language**: TypeScript
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Interface**: REST API + gRPC Client (calls user-service)
- **Database**: PostgreSQL (`reservations_db`)
- **Messaging**: RabbitMQ (publisher)

## Description

The reservation service manages booking entities. It connects a `UserID` with a `CourtID` and a time slot. On a successful reservation, it publishes an event to RabbitMQ so the notification-service can send a confirmation.

Before creating a booking, it calls the user-service via gRPC to verify the user's identity.

## Environment Variables

| Variable                | Description                       | Default                              |
|-------------------------|-----------------------------------|--------------------------------------|
| `DATABASE_HOST`         | PostgreSQL host                   | `postgres`                           |
| `DATABASE_PORT`         | PostgreSQL port                   | `5432`                               |
| `DATABASE_NAME`         | Database name                     | `reservations_db`                    |
| `DATABASE_USER`         | Database user                     | `postgres`                           |
| `DATABASE_PASSWORD`     | Database password                 | `postgres`                           |
| `APP_PORT`              | HTTP listen port                  | `3001`                               |
| `USER_SERVICE_GRPC_URL` | gRPC address of user-service      | `user-service:50051`                 |
| `RABBITMQ_URL`          | RabbitMQ connection string        | `amqp://guest:guest@rabbitmq:5672`   |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 3001 | HTTP     | REST API    |

## Running with Docker

```bash
docker compose up reservation-service
```
