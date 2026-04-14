import { Elysia, t } from "elysia";
import { eq, and, gte, lt } from "drizzle-orm";
import { db, schema } from "../db";
import { getUser } from "../grpc/userClient";
import { config } from "../config";

const { reservations } = schema;

// Operating hours: 7:00 – 21:00 (14 one-hour slots per day)
const FIRST_HOUR = 7;
const LAST_HOUR = 20; // last slot starts at 20:00, ends at 21:00

function isFullHour(date: Date): boolean {
  return date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

function isWithinOperatingHours(date: Date): boolean {
  const hour = date.getUTCHours();
  return hour >= FIRST_HOUR && hour <= LAST_HOUR;
}

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

  .get(
    "/court/:courtId/available",
    async ({ params, query, set }) => {
      const { courtId } = params;
      const dateStr = query.date;

      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        set.status = 400;
        return { error: "Query parameter 'date' is required (YYYY-MM-DD)" };
      }

      const dayStart = new Date(`${dateStr}T00:00:00Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59Z`);

      // Fetch all confirmed reservations for this court on the given day
      const existing = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.courtId, courtId),
            eq(reservations.status, "confirmed"),
            gte(reservations.startTime, dayStart),
            lt(reservations.startTime, dayEnd),
          )
        );

      const bookedHours = new Set(existing.map((r) => new Date(r.startTime).getUTCHours()));

      const slots = [];
      for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
        const startTime = `${dateStr}T${String(hour).padStart(2, "0")}:00:00Z`;
        slots.push({ startTime, available: !bookedHours.has(hour) });
      }

      return { courtId, date: dateStr, slots };
    },
    {
      params: t.Object({ courtId: t.String({ format: "uuid" }) }),
      query: t.Object({ date: t.String() }),
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

      if (!isFullHour(startTime)) {
        set.status = 400;
        return { error: "Reservations must start on a full hour" };
      }

      if (!isWithinOperatingHours(startTime)) {
        set.status = 400;
        return { error: `Reservations are available between ${FIRST_HOUR}:00 and ${LAST_HOUR + 1}:00 UTC` };
      }

      // endTime is always startTime + 1 hour
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      // Check for overlapping reservation on the same court
      const overlapping = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.courtId, body.courtId),
            eq(reservations.startTime, startTime),
            eq(reservations.status, "confirmed"),
          )
        );

      if (overlapping.length > 0) {
        set.status = 409;
        return { error: "This time slot is already booked for the selected court" };
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

      // Notify the notification service (fire-and-forget)
      fetch(`${config.notificationServiceUrl}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: body.userId,
          type: "reservation_confirmed",
          title: "Reservation Confirmed",
          message: `Your court has been booked from ${startTime.toISOString()} to ${endTime.toISOString()}.`,
        }),
      }).catch((err) => console.error("Failed to send notification:", err));

      set.status = 201;
      return reservation;
    },
    {
      body: t.Object({
        userId: t.String({ format: "uuid" }),
        courtId: t.String({ format: "uuid" }),
        startTime: t.String(),
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

      const current = existing[0];
      if (!current) {
        set.status = 404;
        return { error: "Reservation not found" };
      }

      const updates: Record<string, any> = {};

      if (body.startTime) {
        const newStart = new Date(body.startTime);
        if (!isFullHour(newStart)) {
          set.status = 400;
          return { error: "Reservations must start on a full hour" };
        }
        if (!isWithinOperatingHours(newStart)) {
          set.status = 400;
          return { error: `Reservations are available between ${FIRST_HOUR}:00 and ${LAST_HOUR + 1}:00 UTC` };
        }

        // Check for overlap at new time (excluding this reservation)
        const overlapping = await db
          .select()
          .from(reservations)
          .where(
            and(
              eq(reservations.courtId, current.courtId),
              eq(reservations.startTime, newStart),
              eq(reservations.status, "confirmed"),
            )
          );

        const overlapExcludingSelf = overlapping.filter((r) => r.id !== params.id);
        if (overlapExcludingSelf.length > 0) {
          set.status = 409;
          return { error: "This time slot is already booked for the selected court" };
        }

        updates.startTime = newStart;
        updates.endTime = new Date(newStart.getTime() + 60 * 60 * 1000);
      }

      if (body.totalPrice) updates.totalPrice = body.totalPrice;
      if (body.status) updates.status = body.status;

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
