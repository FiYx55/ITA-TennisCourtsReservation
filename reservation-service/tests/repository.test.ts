import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { reservations, type NewReservation } from "../src/db/schema";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  `postgres://${process.env.DATABASE_USER ?? "postgres"}:${process.env.DATABASE_PASSWORD ?? "postgres"}@${process.env.DATABASE_HOST ?? "localhost"}:${process.env.DATABASE_PORT ?? "2010"}/${process.env.DATABASE_NAME ?? "reservations_db"}`;

// Check if Postgres is reachable before running tests
let dbAvailable = false;
const probe = postgres(TEST_DB_URL, { connect_timeout: 3 });
try {
  await probe`SELECT 1`;
  dbAvailable = true;
} catch {
  console.warn("PostgreSQL not available — skipping repository tests");
} finally {
  await probe.end();
}

const client = dbAvailable ? postgres(TEST_DB_URL) : (null as any);
const db = dbAvailable ? drizzle(client) : (null as any);

const USER_ID = "00000000-0000-0000-0000-000000000001";
const COURT_ID = "00000000-0000-0000-0000-000000000099";

function makeReservation(overrides?: Partial<NewReservation>): NewReservation {
  return {
    userId: USER_ID,
    courtId: COURT_ID,
    startTime: new Date("2026-04-01T10:00:00Z"),
    endTime: new Date("2026-04-01T11:00:00Z"),
    totalPrice: "25.00",
    ...overrides,
  };
}

beforeEach(async () => {
  if (!dbAvailable) return;
  // Ensure table exists
  await client`
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      court_id UUID NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Clear table before each test
  await db.delete(reservations);
});

afterAll(async () => {
  if (client) await client.end();
});

const testFn = dbAvailable ? it : it.skip;

describe("Reservation Repository", () => {
  testFn("should insert a reservation", async () => {
    const [created] = await db.insert(reservations).values(makeReservation()).returning();

    expect(created.id).toBeDefined();
    expect(created.userId).toBe(USER_ID);
    expect(created.courtId).toBe(COURT_ID);
    expect(created.status).toBe("confirmed");
    expect(created.totalPrice).toBe("25.00");
  });

  testFn("should fetch a reservation by id", async () => {
    const [created] = await db.insert(reservations).values(makeReservation()).returning();

    const [fetched] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, created.id));

    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(created.id);
    expect(fetched.userId).toBe(USER_ID);
  });

  testFn("should fetch reservations by userId", async () => {
    await db.insert(reservations).values(makeReservation());
    await db.insert(reservations).values(
      makeReservation({
        startTime: new Date("2026-04-02T10:00:00Z"),
        endTime: new Date("2026-04-02T11:00:00Z"),
      })
    );

    const results = await db
      .select()
      .from(reservations)
      .where(eq(reservations.userId, USER_ID));

    expect(results.length).toBe(2);
  });

  testFn("should update a reservation", async () => {
    const [created] = await db.insert(reservations).values(makeReservation()).returning();

    const [updated] = await db
      .update(reservations)
      .set({ totalPrice: "35.00", status: "cancelled" })
      .where(eq(reservations.id, created.id))
      .returning();

    expect(updated.totalPrice).toBe("35.00");
    expect(updated.status).toBe("cancelled");
  });

  testFn("should delete a reservation", async () => {
    const [created] = await db.insert(reservations).values(makeReservation()).returning();

    await db.delete(reservations).where(eq(reservations.id, created.id));

    const results = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, created.id));

    expect(results.length).toBe(0);
  });

  testFn("should list all reservations", async () => {
    await db.insert(reservations).values(makeReservation());
    await db.insert(reservations).values(
      makeReservation({
        courtId: "00000000-0000-0000-0000-000000000088",
        startTime: new Date("2026-04-03T14:00:00Z"),
        endTime: new Date("2026-04-03T15:00:00Z"),
        totalPrice: "40.00",
      })
    );

    const results = await db.select().from(reservations);
    expect(results.length).toBe(2);
  });
});
