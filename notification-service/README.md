# Notification Service

Manages notifications and publishes them to RabbitMQ for real-time delivery.

## Technology

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Sequelize
- **Message Broker**: RabbitMQ (amqplib)
- **API Docs**: Swagger (OpenAPI 3.0)
- **Database**: PostgreSQL (`notifications_db`)

## Description

The notification service acts as a message broker in the system. Other services (user-service, court-service, reservation-service) send API calls to create notifications. The service stores them in a database and publishes them to a RabbitMQ fanout exchange. Consumers (API gateway, frontend) can subscribe to the queue for real-time updates (e.g., bell icon).

## API Endpoints

| Method | Path                                | Description                        |
|--------|-------------------------------------|------------------------------------|
| GET    | `/health`                           | Health check                       |
| POST   | `/notifications`                    | Create a notification              |
| GET    | `/notifications/:userId`            | Get all notifications for a user   |
| GET    | `/notifications/:userId/unread/count` | Get unread count for a user      |
| PATCH  | `/notifications/:id/read`           | Mark a notification as read        |
| DELETE | `/notifications/:id`                | Delete a notification              |
| GET    | `/docs`                             | Swagger UI                         |
| GET    | `/docs.json`                        | OpenAPI spec (JSON)                |

## Environment Variables

| Variable            | Description                    | Default                              |
|---------------------|--------------------------------|--------------------------------------|
| `DATABASE_HOST`     | PostgreSQL host                | `localhost`                          |
| `DATABASE_PORT`     | PostgreSQL port                | `5432`                               |
| `DATABASE_NAME`     | Database name                  | `notifications_db`                   |
| `DATABASE_USER`     | Database user                  | `postgres`                           |
| `DATABASE_PASSWORD` | Database password              | `postgres`                           |
| `APP_PORT`          | HTTP listen port               | `2006`                               |
| `RABBITMQ_URL`      | RabbitMQ connection string     | `amqp://guest:guest@localhost:5672`  |

## Ports

| Port  | Protocol | Description      |
|-------|----------|------------------|
| 2006  | HTTP     | REST API         |

## Running with Docker

```bash
docker compose up notification-service
```

## Running Locally

```bash
cd notification-service
pnpm install
pnpm run dev
```

## Testing

```bash
# Run all tests (mocked, no DB or RabbitMQ required)
pnpm run test
```

## Project Structure

```
src/
├── index.ts                           # App entry point
├── app.ts                             # Express app + Swagger setup
├── config/index.ts                    # Environment configuration
├── db/
│   ├── index.ts                       # Sequelize connection
│   └── Notification.ts                # Notification model
├── broker/index.ts                    # RabbitMQ publisher
└── controllers/
    └── notificationController.ts      # REST endpoints + Swagger docs
tests/
└── endpoints.test.ts                  # Endpoint tests (vitest + supertest)
```
