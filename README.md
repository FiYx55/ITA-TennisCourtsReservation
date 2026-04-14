# Tennis Court Reservation System

A microservices-based system for managing tennis court reservations, built with a polyglot architecture.

## Architecture Overview

```
              ┌───────────────────┐          ┌──────────────────────┐
              │    web-client     │          │   mobile-client      │
              │  (Next.js/React)  │          │   (not implemented)  │
              └────────┬──────────┘          └──────────┬───────────┘
                       │ HTTP                           │ HTTP
              ┌────────▼──────────┐          ┌──────────▼───────────┐
              │   api-gateway     │          │ api-gateway-mobile   │
              │ (Node.js/Express) │          │  (Node.js/Fastify)   │
              └──┬──┬──────┬────┬┘          └──┬──┬─────┬────┬─────┘
           gRPC  │  │ REST │REST│        gRPC  │  │REST │REST│
              ┌──┘  │      │    └────┐      ┌──┘  │     │    └────┐
              │     │      │         │      │     │     │         │
    ┌─────────▼─────┴──┐ ┌─▼──────────┐ ┌──▼─────┴─────▼──┐ ┌────▼──────────────┐
    │   user-service   │ │court-service│ │reservation-svc  │ │notification-svc   │
    │  (C# / .NET 9)   │ │(Python/    │ │(Bun / ElysiaJS) │ │(Node.js/Express)  │
    │   gRPC Server    │ │ FastAPI)   │ │REST + gRPC Cli. │ │REST + RabbitMQ    │
    └─────────┬────────┘ └──────┬─────┘ └──┬──────────┬───┘ └────────┬──────────┘
              ▼                 ▼           │          ▼              ▼
         PostgreSQL        PostgreSQL       │     PostgreSQL     PostgreSQL
         (users_db)        (courts_db)      │   (reservations_db)(notifications_db)
                                            ▼
                                       ┌──────────┐
                                       │ RabbitMQ │
                                       └──────────┘
```

## Services

| Service                  | Language / Framework           | Interface          | Database   |
|--------------------------|--------------------------------|--------------------|------------|
| **web-client**           | TypeScript (Next.js / React)   | UI                 | —          |
| **api-gateway**          | TypeScript (Node.js / Express) | REST (Web BFF)     | —          |
| **api-gateway-mobile**   | TypeScript (Node.js / Fastify) | REST (Mobile BFF)  | —          |
| **user-service**         | C# (.NET 9 / gRPC Server)     | gRPC               | PostgreSQL |
| **court-service**        | Python (FastAPI)               | REST               | PostgreSQL |
| **reservation-service**  | TypeScript (Bun / ElysiaJS)    | REST + gRPC Client | PostgreSQL |
| **notification-service** | TypeScript (Node.js / Express) | REST + RabbitMQ    | PostgreSQL |

## Ports

| Service                  | Port | Docs |
|--------------------------|------|------|
| **web-client**           | 2000 | — |
| **api-gateway**          | 2001 | [localhost:2001/docs](http://localhost:2001/docs) |
| **api-gateway-mobile**   | 2007 | [localhost:2007/docs](http://localhost:2007/docs) |
| **user-service**         | 2002 | — |
| **court-service**        | 2003 | [localhost:2003/docs](http://localhost:2003/docs) |
| **reservation-service**  | 2004 | [localhost:2004/swagger](http://localhost:2004/swagger) |
| **notification-service** | 2006 | [localhost:2006/docs](http://localhost:2006/docs) |
| **grpcui**               | 2005 | [localhost:2005](http://localhost:2005) |

## Repository Structure

```
/
├── web-client/               # Next.js web client
├── api-gateway/              # Express API gateway (web BFF)
├── api-gateway-mobile/       # Fastify API gateway (mobile BFF)
├── user-service/             # Users, profiles, authorization (C#)
├── court-service/            # Court catalog and statuses (Python)
├── reservation-service/      # Booking system (Bun)
├── notification-service/     # Notification processing (Node.js)
├── proto/                    # Shared gRPC contract definitions
├── docker-compose.yml        # Infrastructure (databases, message broker)
├── GATEWAY-SPEC.md           # API gateway endpoint specification
└── README.md                 # This file
```

## Key Design Decisions

- **Database per service**: Each service that requires persistence has its own database. Although they may run inside the same PostgreSQL container, services must never directly access another service's database.
- **BFF (Backend for Frontend) gateways**: Two API gateways — Express for web (full admin + user features) and Fastify for mobile (user-facing subset). Gateways aggregate and enrich data from multiple downstream services into single responses.
- **gRPC for internal communication**: The user-service exposes a gRPC interface. Both API gateways and the reservation-service call it to verify user identity.
- **Event-driven notifications**: On successful booking, the reservation-service publishes an event to RabbitMQ. The notification-service consumes it and sends a simulated email.
- **Fixed 1-hour reservation slots**: Reservations are constrained to full-hour time blocks within operating hours (7:00–21:00 UTC), with server-side overlap detection.

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Running Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (with three databases) and RabbitMQ.
