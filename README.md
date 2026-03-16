# Tennis Court Reservation System

A microservices-based system for managing tennis court reservations, built with a polyglot architecture.

## Architecture Overview

```
                         ┌───────────────────┐
                         │    web-client     │
                         │  (Next.js/React)  │
                         └────────┬──────────┘
                                  │ HTTP
                         ┌────────▼──────────┐
                         │   api-gateway     │
                         │ (Node.js/Express) │
                         └──┬──────┬───────┬─┘
                     gRPC   │      │ REST  │ REST
              ┌─────────────┘      │       └───────────────┐
              │                    │                       │
    ┌─────────▼────────┐   ┌───────▼──────────┐  ┌─────────▼───────────┐
    │   user-service   │   │  court-service   │  │ reservation-service │
    │  (C# / .NET 8)   │   │ (Python/FastAPI) │  │  (Bun / ElysiaJS)   │
    │   gRPC Server    │   │    REST API      │  │  REST + gRPC Client │
    └─────────┬────────┘   └───────┬──────────┘  └───┬────────────┬────┘
              │                    │                 │            │
              ▼                    ▼                 │            ▼
         PostgreSQL           PostgreSQL             │         PostgreSQL
         (users_db)           (courts_db)            │       (reservations_db)
                                                     ▼
                                                ┌──────────┐
                                                │ RabbitMQ │
                                                └─────┬────┘
                                                      │
                                           ┌──────────▼───────────┐
                                           │ notification-service │
                                           │   (Node.js/amqplib)  │
                                           └──────────────────────┘
```

## Services

| Service                 | Language / Framework          | Interface         | Database   |
|-------------------------|-------------------------------|-------------------|------------|
| **web-client**          | TypeScript (Next.js / React)  | UI                | —          |
| **api-gateway**         | TypeScript (Node.js / Express)| REST (Entry Point)| —          |
| **user-service**        | C# (.NET 8 / gRPC Server)     | gRPC              | PostgreSQL |
| **court-service**       | Python (FastAPI)              | REST              | PostgreSQL |
| **reservation-service** | TypeScript (Bun / ElysiaJS)   | REST + gRPC Client| PostgreSQL |
| **notification-service**| TypeScript (Node.js / amqplib)| RabbitMQ Consumer | —          |

## Ports

| Service                 | Port | Docs |
|-------------------------|------|------|
| **web-client**          | 2000 | — |
| **api-gateway**         | 2001 | — |
| **user-service**        | 2002 | — |
| **court-service**       | 2003 | [localhost:2003/docs](http://localhost:2003/docs) |
| **reservation-service** | 2004 | — |
| **notification-service** | —   | — |

## Repository Structure

```
/
├── web-client/               # Next.js web client
├── api-gateway/              # Express API gateway
├── user-service/             # Users, profiles, authorization (C#)
├── court-service/            # Court catalog and statuses (Python)
├── reservation-service/      # Booking system (Bun)
├── notification-service/     # Notification processing (Node.js)
├── proto/                    # Shared gRPC contract definitions
├── docker-compose.yml        # Infrastructure (databases, message broker)
└── README.md                 # This file
```

## Key Design Decisions

- **Database per service**: Each service that requires persistence has its own database. Although they may run inside the same PostgreSQL container, services must never directly access another service's database.
- **gRPC for internal communication**: The user-service exposes a gRPC interface. Other services call it to verify user identity.
- **Event-driven notifications**: On successful booking, the reservation-service publishes an event to RabbitMQ. The notification-service consumes it and sends a simulated email.

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Running Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (with three databases) and RabbitMQ.
