import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { getUser } from "../grpc/userClient";

const { reservations } = schema;

export const reservationController = new Elysia({ prefix: "/reservations" })
  .get("/", async () => {
    const result = await db.select().from(reservations);
    return result;
  })

  .get(
    "/:id",
    async ({ params, set }) => {
      const result = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, params.id));

      if (result.length === 0) {
        set.status = 404;
        return { error: "Reservation not found" };
      }
      return result[0];
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    }
  )

  .get(
    "/user/:userId",
    async ({ params }) => {
      const result = await db
        .select()
        .from(reservations)
        .where(eq(reservations.userId, params.userId));
      return result;
    },
    {
      params: t.Object({ userId: t.String({ format: "uuid" }) }),
    }
  )

  .post(
    "/",
    async ({ body, set }) => {
      // Verify user exists via gRPC
      try {
        const user = await getUser(body.userId);
        if (!user || !user.isActive) {
          set.status = 400;
          return { error: "User not found or inactive" };
        }
      } catch {
        set.status = 502;
        return { error: "Could not verify user" };
      }

      const startTime = new Date(body.startTime);
      const endTime = new Date(body.endTime);

      if (endTime <= startTime) {
        set.status = 400;
        return { error: "End time must be after start time" };
      }

      const [reservation] = await db
        .insert(reservations)
        .values({
          userId: body.userId,
          courtId: body.courtId,
          startTime,
          endTime,
          totalPrice: body.totalPrice,
        })
        .returning();

      set.status = 201;
      return reservation;
    },
    {
      body: t.Object({
        userId: t.String({ format: "uuid" }),
        courtId: t.String({ format: "uuid" }),
        startTime: t.String(),
        endTime: t.String(),
        totalPrice: t.String(),
      }),
    }
  )

  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, params.id));

      if (existing.length === 0) {
        set.status = 404;
        return { error: "Reservation not found" };
      }

      const updates: Record<string, any> = {};
      if (body.startTime) updates.startTime = new Date(body.startTime);
      if (body.endTime) updates.endTime = new Date(body.endTime);
      if (body.totalPrice) updates.totalPrice = body.totalPrice;
      if (body.status) updates.status = body.status;

      if (updates.startTime && updates.endTime && updates.endTime <= updates.startTime) {
        set.status = 400;
        return { error: "End time must be after start time" };
      }

      const [updated] = await db
        .update(reservations)
        .set(updates)
        .where(eq(reservations.id, params.id))
        .returning();

      return updated;
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
        totalPrice: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, params.id));

      if (existing.length === 0) {
        set.status = 404;
        return { error: "Reservation not found" };
      }

      await db.delete(reservations).where(eq(reservations.id, params.id));
      set.status = 204;
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    }
  );
