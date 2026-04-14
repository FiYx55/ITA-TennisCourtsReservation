# API Gateway Specification

Both gateways follow the **Backend for Frontend (BFF)** pattern — they orchestrate and aggregate
calls to downstream services, returning enriched responses instead of simply proxying requests.

## Downstream Services

| Service              | Interface | Base URL (internal)                    |
|----------------------|-----------|----------------------------------------|
| **user-service**     | gRPC      | `user-service:2002`                    |
| **court-service**    | REST      | `http://court-service:2003`            |
| **reservation-service** | REST   | `http://reservation-service:2004`      |
| **notification-service** | REST  | `http://notification-service:2006`     |

---

## Aggregated Endpoints

### Auth

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `POST /auth/register` | yes | yes | user-service `CreateUser` (gRPC) | Register a new user |
| `POST /auth/login` | yes | yes | user-service `VerifyUser` (gRPC) → `GetUser` (gRPC) | Verify credentials, return full user profile |

### Users (admin)

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `GET /users` | yes | no | user-service `GetUsers` (gRPC) | List all users |
| `GET /users/:id` | yes | no | user-service `GetUser` (gRPC) | Get user by ID |
| `PUT /users/:id` | yes | no | user-service `UpdateUser` (gRPC) | Update user |
| `DELETE /users/:id` | yes | no | user-service `DeleteUser` (gRPC) | Deactivate user |

### Courts

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `GET /courts` | yes | yes | court-service `GET /courts` | List all courts |
| `GET /courts/:id` | yes | yes | court-service `GET /courts/:id` + reservation-service `GET /reservations/court/:id/available?date=today` | **Aggregated**: court details + today's available slots |
| `POST /courts` | yes | no | court-service `POST /courts` | Create court (admin) |
| `PUT /courts/:id` | yes | no | court-service `PUT /courts/:id` | Update court (admin) |
| `DELETE /courts/:id` | yes | no | court-service `DELETE /courts/:id` | Delete court (admin) |

### Reservations

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `GET /reservations` | yes | no | reservation-service `GET /reservations` + court-service (per court) + user-service (per user, gRPC) | **Aggregated**: all reservations enriched with court name and user name (admin) |
| `GET /reservations/:id` | yes | yes | reservation-service `GET /reservations/:id` + court-service `GET /courts/:courtId` + user-service `GetUser` (gRPC) | **Aggregated**: reservation enriched with court and user details |
| `GET /reservations/user/:userId` | yes | yes | reservation-service `GET /reservations/user/:userId` + court-service (per court) | **Aggregated**: user's reservations enriched with court names |
| `GET /reservations/court/:courtId/available` | yes | yes | reservation-service `GET /reservations/court/:courtId/available?date=` | Available time slots for a court on a given date |
| `POST /reservations` | yes | yes | court-service `GET /courts/:courtId` + reservation-service `POST /reservations` | **Aggregated**: verify court exists, create reservation, return enriched response with court name |
| `PUT /reservations/:id` | yes | no | reservation-service `PUT /reservations/:id` | Update reservation (admin) |
| `DELETE /reservations/:id` | yes | yes | reservation-service `DELETE /reservations/:id` | Cancel reservation |

### Notifications

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `GET /notifications/:userId` | yes | yes | notification-service `GET /notifications/:userId` | Get user's notifications |
| `GET /notifications/:userId/unread/count` | yes | yes | notification-service `GET /notifications/:userId/unread/count` | Unread notification count |
| `PATCH /notifications/:id/read` | yes | yes | notification-service `PATCH /notifications/:id/read` | Mark notification as read |
| `DELETE /notifications/:id` | yes | no | notification-service `DELETE /notifications/:id` | Delete notification (admin) |
| `POST /notifications` | yes | no | notification-service `POST /notifications` | Create notification (admin) |

### Dashboard (aggregated)

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `GET /dashboard` | no | yes | user-service `GetUser` (gRPC) + reservation-service `GET /reservations/user/:userId` + court-service (per court) + notification-service `GET /notifications/:userId/unread/count` | **Aggregated**: mobile home screen — user profile, upcoming reservations with court names, unread notification count |
| `GET /admin/dashboard` | yes | no | user-service `GetUsers` (gRPC) + court-service `GET /courts` + reservation-service `GET /reservations` | **Aggregated**: admin overview — user count, court count, today's reservation count |

### Health

| Endpoint | Web | Mobile | Downstream calls | Description |
|---|---|---|---|---|
| `GET /health` | yes | yes | none | Gateway health check |

---

## Endpoint Totals

| Gateway | Total endpoints | Aggregated (multi-service) |
|---|---|---|
| **Web (Express)** | 21 | 5 |
| **Mobile (Fastify)** | 13 | 5 |

## Key Aggregation Patterns

1. **Enrichment** — Fetch a resource, then fetch related data from other services to add names/details (e.g., reservation → add court name + user name)
2. **Composition** — Combine unrelated data into a single response for a specific UI view (e.g., dashboard → profile + reservations + notification count)
3. **Orchestration** — Validate across services before mutating (e.g., POST reservation → check court exists first)

## Notes

- The mobile gateway (`api-gateway-mobile`) uses **Fastify** on port **2007**
- The web gateway (`api-gateway`) uses **Express** on port **2001**
- Both gateways talk to `user-service` via **gRPC** and to all other services via **REST**
- Enrichment calls should be made **in parallel** where possible (e.g., fetch court + user at the same time)
- All aggregated responses are **gateway-shaped** — downstream service schemas are not leaked to clients
