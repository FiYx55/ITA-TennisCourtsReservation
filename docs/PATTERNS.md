# New Microservices Patterns

Two patterns added beyond the existing set (BFF, API Gateway, Database per Service, API Composition, Health Check API, etc.).

## 1. Žeton za dostop (Access Token / JWT) — *Varnost*

Stateless authentication across both gateways and downstream services.

**Where:** `api-gateway` and `api-gateway-mobile`.
- `signToken()` issues HS256 JWT on `POST /auth/register` and `POST /auth/login` (payload: `sub`, `email`, `role`).
- `requireAuth` / `requireRole('admin')` middleware (Express) and `fastify.requireAuth` / `fastify.requireAdmin` hooks (Fastify) protect routes.
- Web client stores the token in `localStorage` and attaches `Authorization: Bearer <token>` to every request.

**Protection map (web gateway):**
- Public: `/auth/*`, `GET /courts`, `GET /courts/:id`
- Authenticated user: reservations, own notifications
- Admin only: all `/users`, court write ops, `GET /reservations` (all), notification write ops, `/admin/dashboard`

**Config:** `JWT_SECRET`, `JWT_EXPIRES_IN` in `.env` → wired into both gateways via `docker-compose.yml`.

### How to test
```bash
:: 1. Login -> get token
curl -s -X POST http://localhost:2001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
:: -> { "token": "eyJ...", "user": { ... } }

:: 2. Protected route without token -> 401
curl -i http://localhost:2001/api/users

:: 3. Protected route with token -> 200
curl -i http://localhost:2001/api/users ^
  -H "Authorization: Bearer <TOKEN>"

:: 4. Non-admin token hitting admin route -> 403
```
#### Or just go to swagger UI (`http://localhost:2001/docs`), click "Authorize", paste the token, and try out protected endpoints from there.
---

## 2. Odklopnik (Circuit Breaker) — *Zanesljivost*

Fail-fast + graceful degradation when a downstream service is unhealthy. Implemented with `opossum` in `api-gateway`.

**Where:** `api-gateway/src/common/breaker/index.ts`.
- One breaker per downstream: `court-service`, `reservation-service`, `notification-service`, `user-service` (gRPC).
- Settings: `timeout: 3 s`, `errorThresholdPercentage: 50`, `resetTimeout: 10 s`.
- 5xx counts as a failure; 4xx does not.
- Aggregated endpoints (`/admin/dashboard`, `/courts/:id`, reservation enrichment) catch breaker errors per call → return **partial** responses instead of failing.

**Error mapping (`server.ts`):**
- `EOPENBREAKER` → 503
- `ETIMEDOUT` → 504
- 5xx downstream → 502

**Observability:** `GET /breaker-status` returns each breaker's state and opossum stats.

### How to test
```bash
:: 1. Healthy state
curl -s http://localhost:2001/breaker-status

:: 2. Kill a downstream
docker stop tennis-court-service

:: 3. Hit endpoint ~6 times -- first few time out (3 s), then breaker opens
::    (interactive cmd: single %; in a .bat file, double the %% in both places)
for /L %i in (1,1,6) do @curl -s -o NUL -w "%{http_code} " http://localhost:2001/api/courts
:: -> 504 504 504 503 503 503  (open after threshold)

:: 4. Verify breaker state
curl -s http://localhost:2001/breaker-status

:: 5. Aggregated endpoint still partially works (dashboard with courtCount=0)
curl -s -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:2001/api/admin/dashboard

:: 6. Recover
docker start tennis-court-service
:: After 10 s the breaker goes halfOpen -> closed on first success.
```
