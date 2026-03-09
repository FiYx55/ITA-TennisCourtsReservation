# API Gateway

Central entry point that routes requests to internal microservices.

## Technology

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express
- **Interface**: REST (inbound), gRPC + REST (outbound to services)

## Description

The API Gateway is the single entry point for all client requests. It routes HTTP/REST calls to the appropriate internal services:

- **user-service** → via gRPC
- **court-service** → via REST
- **reservation-service** → via REST

## Environment Variables

| Variable                  | Description                        | Default                          |
|---------------------------|------------------------------------|----------------------------------|
| `PORT`                    | Gateway listen port                | `4000`                           |
| `USER_SERVICE_GRPC_URL`   | gRPC address of user-service       | `user-service:50051`             |
| `COURT_SERVICE_URL`       | HTTP address of court-service      | `http://court-service:8000`      |
| `RESERVATION_SERVICE_URL` | HTTP address of reservation-service| `http://reservation-service:3001`|

## Ports

| Port | Description |
|------|-------------|
| 4000 | HTTP REST   |

## Running with Docker

```bash
docker compose up api-gateway
```
