#!/bin/bash
# Seed script: creates admin user and sample courts if they don't exist.
# Expects services to be running (docker compose up).

set -e

API_URL="${API_URL:-http://localhost:2001/api}"
DB_USER="${DB_USER:-postgres}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-tennis-postgres}"

# Run SQL against a database via docker exec
run_sql() {
  local db="$1"
  local sql="$2"
  docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$db" -tAc "$sql" 2>/dev/null
}

echo "⏳ Waiting for API gateway..."
for i in $(seq 1 30); do
  if curl -sf "$API_URL/../health" > /dev/null 2>&1; then
    echo "✅ API gateway is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ API gateway not ready after 30s"
    exit 1
  fi
  sleep 1
done

# --- Seed admin user ---
ADMIN_EMAIL="admin@tennis.com"
ADMIN_PASSWORD="admin123"
ADMIN_FIRST="Admin"
ADMIN_LAST="User"

echo ""
echo "👤 Checking admin user..."
EXISTING=$(run_sql users_db "SELECT \"Id\" FROM \"Users\" WHERE \"Email\" = '$ADMIN_EMAIL';" || echo "")

if [ -z "$EXISTING" ]; then
  echo "   Creating admin user ($ADMIN_EMAIL)..."
  RESULT=$(curl -sf -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"firstName\":\"$ADMIN_FIRST\",\"lastName\":\"$ADMIN_LAST\",\"password\":\"$ADMIN_PASSWORD\"}")
  ADMIN_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$ADMIN_ID" ]; then
    echo "   Setting role to admin..."
    run_sql users_db "UPDATE \"Users\" SET \"Role\" = 'admin' WHERE \"Id\" = '$ADMIN_ID';" > /dev/null
    echo "   ✅ Admin user created (id: $ADMIN_ID)"
  else
    echo "   ❌ Failed to create admin user"
    echo "   Response: $RESULT"
  fi
else
  echo "   ✅ Admin user already exists (id: $EXISTING)"
  run_sql users_db "UPDATE \"Users\" SET \"Role\" = 'admin' WHERE \"Id\" = '$EXISTING';" > /dev/null
fi

# --- Seed courts ---
echo ""
echo "🎾 Checking courts..."
COURT_COUNT=$(run_sql courts_db "SELECT COUNT(*) FROM courts;" || echo "0")

if [ "$COURT_COUNT" -eq 0 ] 2>/dev/null; then
  echo "   Creating sample courts..."

  curl -sf -X POST "$API_URL/courts" -H "Content-Type: application/json" \
    -d '{"name":"Center Court","surface":"clay","is_indoor":false,"hourly_rate":25.0}' > /dev/null
  echo "   ✅ Center Court (clay, outdoor, €25/hr)"

  curl -sf -X POST "$API_URL/courts" -H "Content-Type: application/json" \
    -d '{"name":"Indoor Arena","surface":"hard","is_indoor":true,"hourly_rate":35.0}' > /dev/null
  echo "   ✅ Indoor Arena (hard, indoor, €35/hr)"

  curl -sf -X POST "$API_URL/courts" -H "Content-Type: application/json" \
    -d '{"name":"Grass Court 1","surface":"grass","is_indoor":false,"hourly_rate":30.0}' > /dev/null
  echo "   ✅ Grass Court 1 (grass, outdoor, €30/hr)"

  curl -sf -X POST "$API_URL/courts" -H "Content-Type: application/json" \
    -d '{"name":"Practice Court A","surface":"hard","is_indoor":false,"hourly_rate":15.0}' > /dev/null
  echo "   ✅ Practice Court A (hard, outdoor, €15/hr)"

  curl -sf -X POST "$API_URL/courts" -H "Content-Type: application/json" \
    -d '{"name":"Clay Court 2","surface":"clay","is_indoor":false,"hourly_rate":20.0}' > /dev/null
  echo "   ✅ Clay Court 2 (clay, outdoor, €20/hr)"
else
  echo "   ✅ Courts already exist ($COURT_COUNT found)"
fi

echo ""
echo "🎉 Seed complete!"
echo "   Admin login: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo "   Web client:  http://localhost:2000"
echo "   API gateway: http://localhost:2001"
