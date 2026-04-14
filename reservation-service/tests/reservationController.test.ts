import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Elysia } from "elysia";

// Mock the gRPC client before importing the controller
mock.module("../src/grpc/userClient", () => ({
  getUser: async (id: string) => {
    if (id === "00000000-0000-0000-0000-000000000001") {
      return {
        id: "00000000-0000-0000-0000-000000000001",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        createdAt: new Date().toISOString(),
        isActive: true,
      };
    }
    throw new Error("User not found");
  },
  verifyUser: async () => ({ valid: true, userId: "00000000-0000-0000-0000-000000000001" }),
}));

// In-memory store to mock the database
let store: any[] = [];
let idCounter = 0;

function makeId() {
  idCounter++;
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, "0")}`;
}

// Mock the db module
mock.module("../src/db", () => {
  return {
    db: {
      select: () => ({
        from: (_table: any) => ({
          where: (condition: any) => {
            return store.filter((r) => {
              // Handle drizzle-orm `and()` composite conditions
              if (condition?.operator === "and") {
                return condition.conditions.every((c: any) => {
                  if (c?.left?.name === "id") return r.id === c.right;
                  if (c?.left?.name === "user_id") return r.userId === c.right;
                  if (c?.left?.name === "court_id") return r.courtId === c.right;
                  if (c?.left?.name === "status") return r.status === c.right;
                  if (c?.left?.name === "start_time") {
                    const val = c.right instanceof Date ? c.right.getTime() : new Date(c.right).getTime();
                    const rVal = r.startTime instanceof Date ? r.startTime.getTime() : new Date(r.startTime).getTime();
                    if (c.operator === "gte") return rVal >= val;
                    if (c.operator === "lt") return rVal < val;
                    return rVal === val;
                  }
                  return true;
                });
              }
              if (condition?.left?.name === "id") return r.id === condition.right;
              if (condition?.left?.name === "user_id") return r.userId === condition.right;
              return true;
            });
          },
          then: (resolve: any) => resolve(store),
        }),
      }),
      insert: (_table: any) => ({
        values: (data: any) => ({
          returning: () => {
            const record = {
              id: makeId(),
              ...data,
              status: "confirmed",
              createdAt: new Date(),
            };
            store.push(record);
            return [record];
          },
        }),
      }),
      update: (_table: any) => ({
        set: (data: any) => ({
          where: (condition: any) => ({
            returning: () => {
              const idx = store.findIndex((r) => r.id === condition.right);
              if (idx === -1) return [];
              store[idx] = { ...store[idx], ...data };
              return [store[idx]];
            },
          }),
        }),
      }),
      delete: (_table: any) => ({
        where: (condition: any) => {
          store = store.filter((r) => r.id !== condition.right);
        },
      }),
    },
    schema: {
      reservations: {
        id: { name: "id" },
        userId: { name: "user_id" },
        courtId: { name: "court_id" },
        startTime: { name: "start_time" },
        status: { name: "status" },
      },
    },
  };
});

// Import controller after mocks are set up
const { reservationController } = await import("../src/controllers/reservationController");

const app = new Elysia().use(reservationController).get("/health", () => ({ status: "ok" }));

const RESERVATION_DATA = {
  userId: "00000000-0000-0000-0000-000000000001",
  courtId: "00000000-0000-0000-0000-000000000099",
  startTime: "2026-04-01T10:00:00Z",
  totalPrice: "25.00",
};

beforeEach(() => {
  store = [];
  idCounter = 0;
});

describe("Reservation Controller", () => {
  it("GET /health returns ok", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("GET /reservations returns empty list", async () => {
    const res = await app.handle(new Request("http://localhost/reservations"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST /reservations creates a reservation with computed endTime", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(RESERVATION_DATA),
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.userId).toBe(RESERVATION_DATA.userId);
    expect(data.courtId).toBe(RESERVATION_DATA.courtId);
    expect(data.status).toBe("confirmed");
    // endTime should be startTime + 1 hour
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
  });

  it("POST /reservations rejects non-full-hour startTime", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...RESERVATION_DATA,
          startTime: "2026-04-01T10:30:00Z",
        }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toContain("full hour");
  });

  it("POST /reservations rejects time outside operating hours", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...RESERVATION_DATA,
          startTime: "2026-04-01T05:00:00Z",
        }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toContain("available between");
  });

  it("GET /reservations/:id returns 404 for missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations/00000000-0000-0000-0000-000000000000")
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /reservations/:id returns 404 for missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      })
    );
    expect(res.status).toBe(404);
  });
});
