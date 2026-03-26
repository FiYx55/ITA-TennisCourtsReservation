# Reservation Service

Handles the booking logic, linking users to courts with time slots.

## Technology

- **Language**: TypeScript
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **ORM**: Drizzle ORM
- **Interface**: REST API + gRPC Client (calls user-service)
- **Database**: PostgreSQL (`reservations_db`)
- **Messaging**: RabbitMQ (publisher)

## Description

The reservation service manages booking entities. It connects a `UserID` with a `CourtID` and a time slot. On a successful reservation, it publishes an event to RabbitMQ so the notification-service can send a confirmation.

Before creating a booking, it calls the user-service via gRPC to verify the user's identity.

## API Endpoints

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/health`                   | Health check             |
| GET    | `/reservations`             | List all reservations    |
| GET    | `/reservations/:id`         | Get reservation by ID    |
| GET    | `/reservations/user/:userId`| Get reservations by user |
| POST   | `/reservations`             | Create a reservation     |
| PUT    | `/reservations/:id`         | Update a reservation     |
| DELETE | `/reservations/:id`         | Delete a reservation     |

## Environment Variables

| Variable                | Description                       | Default                              |
|-------------------------|-----------------------------------|--------------------------------------|
| `DATABASE_HOST`         | PostgreSQL host                   | `localhost`                          |
| `DATABASE_PORT`         | PostgreSQL port                   | `5432`                               |
| `DATABASE_NAME`         | Database name                     | `reservations_db`                    |
| `DATABASE_USER`         | Database user                     | `postgres`                           |
| `DATABASE_PASSWORD`     | Database password                 | `postgres`                           |
| `APP_PORT`              | HTTP listen port                  | `2004`                               |
| `USER_SERVICE_GRPC_URL` | gRPC address of user-service      | `localhost:2002`                     |
| `RABBITMQ_URL`          | RabbitMQ connection string        | `amqp://guest:guest@localhost:5672`  |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 2004 | HTTP     | REST API    |

## Running with Docker

```bash
docker compose up reservation-service
```

## Running Locally

```bash
cd reservation-service
bun install
bun run dev
```

## Testing

Requires PostgreSQL running (`docker compose up postgres -d`).

```bash
# Run all tests
bun test

# Run only endpoint tests (mocked, no DB required)
bun run test:endpoints

# Run only repository tests (requires PostgreSQL)
bun run test:repository
```

## Project Structure

```
src/
├── index.ts                 # Elysia app entry point
├── config/index.ts          # Environment configuration
├── db/
│   ├── index.ts             # Drizzle + postgres connection
│   ├── schema.ts            # Reservations table schema
│   └── migrate.ts           # Table creation script
├── grpc/userClient.ts       # gRPC client for user-service
└── controllers/
    └── reservationController.ts  # CRUD endpoints
tests/
├── reservationController.test.ts # Endpoint tests (mocked)
└── repository.test.ts            # Repository tests (real DB)
```
