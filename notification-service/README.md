# Notification Service

Consumes booking events from RabbitMQ and sends simulated email notifications.

## Technology

- **Language**: TypeScript
- **Runtime**: Node.js
- **Library**: amqplib
- **Interface**: RabbitMQ Consumer (no HTTP endpoint)

## Description

The notification service listens on a RabbitMQ queue for booking events published by the reservation-service. When a message arrives, it simulates sending an email notification to the user.

This service has no REST or gRPC interface — it operates purely as an event consumer.

## Environment Variables

| Variable       | Description                    | Default                              |
|----------------|--------------------------------|--------------------------------------|
| `RABBITMQ_URL` | RabbitMQ connection string     | `amqp://guest:guest@rabbitmq:5672`   |

## Running with Docker

```bash
docker compose up notification-service
```
