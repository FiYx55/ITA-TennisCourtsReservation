import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock Sequelize and broker before importing app
vi.mock("../src/db/index.js", () => ({
  sequelize: {
    authenticate: vi.fn(),
    sync: vi.fn(),
    define: vi.fn(),
  },
  connectDatabase: vi.fn(),
}));

vi.mock("../src/broker/index.js", () => ({
  connectBroker: vi.fn(),
  publishNotification: vi.fn(),
  closeBroker: vi.fn(),
}));

// In-memory store for notifications
let store: any[] = [];
let idCounter = 0;

vi.mock("../src/db/Notification.js", () => {
  const MockNotification = {
    create: vi.fn(async (data: any) => {
      idCounter++;
      const notification = {
        id: `00000000-0000-0000-0000-${String(idCounter).padStart(12, "0")}`,
        ...data,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.push(notification);
      return notification;
    }),
    findAll: vi.fn(async ({ where }: any) => {
      return store.filter((n) => n.userId === where.userId);
    }),
    count: vi.fn(async ({ where }: any) => {
      return store.filter((n) => n.userId === where.userId && n.isRead === where.isRead).length;
    }),
    findByPk: vi.fn(async (id: string) => {
      const n = store.find((n) => n.id === id);
      if (!n) return null;
      return {
        ...n,
        save: vi.fn(async () => {
          n.isRead = true;
        }),
        destroy: vi.fn(async () => {
          store = store.filter((s) => s.id !== id);
        }),
      };
    }),
  };
  return { Notification: MockNotification };
});

const { app } = await import("../src/app.js");

const USER_ID = "00000000-0000-0000-0000-000000000001";

beforeEach(() => {
  store = [];
  idCounter = 0;
});

describe("Notification Endpoints", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /notifications creates a notification", async () => {
    const res = await request(app).post("/notifications").send({
      userId: USER_ID,
      type: "reservation_confirmed",
      title: "Booking Confirmed",
      message: "Your court is booked.",
    });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(USER_ID);
    expect(res.body.type).toBe("reservation_confirmed");
    expect(res.body.isRead).toBe(false);
  });

  it("POST /notifications returns 400 for missing fields", async () => {
    const res = await request(app).post("/notifications").send({
      userId: USER_ID,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("GET /notifications/:userId returns user notifications", async () => {
    await request(app).post("/notifications").send({
      userId: USER_ID,
      type: "test",
      title: "Test",
      message: "Test message",
    });

    const res = await request(app).get(`/notifications/${USER_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("GET /notifications/:userId/unread/count returns count", async () => {
    await request(app).post("/notifications").send({
      userId: USER_ID,
      type: "test",
      title: "Test",
      message: "Msg",
    });

    const res = await request(app).get(`/notifications/${USER_ID}/unread/count`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it("PATCH /notifications/:id/read marks as read", async () => {
    const createRes = await request(app).post("/notifications").send({
      userId: USER_ID,
      type: "test",
      title: "Test",
      message: "Msg",
    });

    const res = await request(app).patch(`/notifications/${createRes.body.id}/read`);
    expect(res.status).toBe(200);
  });

  it("PATCH /notifications/:id/read returns 404 for missing", async () => {
    const res = await request(app).patch(
      "/notifications/00000000-0000-0000-0000-000000000000/read"
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /notifications/:id deletes notification", async () => {
    const createRes = await request(app).post("/notifications").send({
      userId: USER_ID,
      type: "test",
      title: "Test",
      message: "Msg",
    });

    const res = await request(app).delete(`/notifications/${createRes.body.id}`);
    expect(res.status).toBe(204);
  });

  it("DELETE /notifications/:id returns 404 for missing", async () => {
    const res = await request(app).delete(
      "/notifications/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status).toBe(404);
  });
});
