import { type FastifyPluginAsync } from 'fastify';
import { config } from '../../config/index';

async function enrichReservationWithCourt(reservation: any): Promise<any> {
  try {
    const courtRes = await fetch(`${config.courtServiceUrl}/courts/${reservation.courtId}`);
    if (courtRes.ok) {
      const court = await courtRes.json() as any;
      return { ...reservation, courtName: court.name, courtSurface: court.surface };
    }
  } catch { /* court enrichment is best-effort */ }
  return reservation;
}

const reservations: FastifyPluginAsync = async (fastify): Promise<void> => {
  // GET /reservations/:id — aggregated: reservation + court details
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Reservations'],
        summary: 'Get reservation enriched with court details',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const res = await fetch(`${config.reservationServiceUrl}/reservations/${id}`);

      if (res.status === 404) {
        reply.status(404);
        return { error: 'Reservation not found' };
      }

      const reservation = await res.json();
      return enrichReservationWithCourt(reservation);
    },
  );

  // GET /reservations/user/:userId — aggregated: user's reservations + court names
  fastify.get(
    '/user/:userId',
    {
      schema: {
        tags: ['Reservations'],
        summary: 'Get user\'s reservations enriched with court names',
        params: {
          type: 'object',
          properties: { userId: { type: 'string', format: 'uuid' } },
          required: ['userId'],
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const res = await fetch(`${config.reservationServiceUrl}/reservations/user/${userId}`);
      reply.status(res.status);
      const items = await res.json() as any[];

      // Enrich all reservations with court names in parallel
      return Promise.all(items.map(enrichReservationWithCourt));
    },
  );

  // GET /reservations/court/:courtId/available — available time slots
  fastify.get(
    '/court/:courtId/available',
    {
      schema: {
        tags: ['Reservations'],
        summary: 'Get available time slots for a court on a given date',
        params: {
          type: 'object',
          properties: { courtId: { type: 'string', format: 'uuid' } },
          required: ['courtId'],
        },
        querystring: {
          type: 'object',
          required: ['date'],
          properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
        },
      },
    },
    async (request, reply) => {
      const { courtId } = request.params as { courtId: string };
      const { date } = request.query as { date: string };
      const res = await fetch(
        `${config.reservationServiceUrl}/reservations/court/${courtId}/available?date=${date}`,
      );
      reply.status(res.status);
      return res.json();
    },
  );

  // POST /reservations — orchestrated: verify court exists, then create reservation
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Reservations'],
        summary: 'Create a reservation (verifies court exists first)',
        body: {
          type: 'object',
          required: ['userId', 'courtId', 'startTime', 'totalPrice'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            courtId: { type: 'string', format: 'uuid' },
            startTime: { type: 'string' },
            totalPrice: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;

      // Step 1: verify court exists
      const courtRes = await fetch(`${config.courtServiceUrl}/courts/${body.courtId}`);
      if (!courtRes.ok) {
        reply.status(404);
        return { error: 'Court not found' };
      }
      const court = await courtRes.json() as any;

      // Step 2: create reservation
      const res = await fetch(`${config.reservationServiceUrl}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const reservation = await res.json();
      reply.status(res.status);

      if (!res.ok) return reservation;

      // Return enriched response
      return {
        ...reservation as object,
        courtName: court.name,
        courtSurface: court.surface,
      };
    },
  );

  // DELETE /reservations/:id — cancel reservation
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Reservations'],
        summary: 'Cancel a reservation',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const res = await fetch(`${config.reservationServiceUrl}/reservations/${id}`, {
        method: 'DELETE',
      });
      reply.status(res.status);
      if (res.status === 204) return;
      return res.json();
    },
  );
};

export default reservations;
