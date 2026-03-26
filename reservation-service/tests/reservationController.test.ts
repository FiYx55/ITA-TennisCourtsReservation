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
  const { eq } = require("drizzle-orm");
  return {
    db: {
      select: () => ({
        from: (_table: any) => ({
          where: (condition: any) => {
            // Filter store based on the condition
            return store.filter((r) => {
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
  endTime: "2026-04-01T11:00:00Z",
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

  it("POST /reservations creates a reservation", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(RESERVATION_DATA),
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.userId).toBe(RESERVATION_DATA.userId);
    expect(data.courtId).toBe(RESERVATION_DATA.courtId);
    expect(data.status).toBe("confirmed");
  });

  it("POST /reservations rejects invalid time range", async () => {
    const res = await app.handle(
      new Request("http://localhost/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...RESERVATION_DATA,
          endTime: "2026-04-01T09:00:00Z", // before start
        }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("End time");
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
