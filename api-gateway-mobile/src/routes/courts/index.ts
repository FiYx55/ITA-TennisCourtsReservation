import { type FastifyPluginAsync } from 'fastify';
import { config } from '../../config/index';

const courts: FastifyPluginAsync = async (fastify): Promise<void> => {
  // GET /courts — list all courts
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Courts'],
        summary: 'List all courts',
      },
    },
    async (_request, reply) => {
      const res = await fetch(`${config.courtServiceUrl}/courts`);
      reply.status(res.status);
      return res.json();
    },
  );

  // GET /courts/:id — aggregated: court details + today's available slots
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Courts'],
        summary: 'Get court details with today\'s available slots',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const today = new Date().toISOString().split('T')[0];

      // Parallel: fetch court details + available slots
      const [courtRes, slotsRes] = await Promise.all([
        fetch(`${config.courtServiceUrl}/courts/${id}`),
        fetch(`${config.reservationServiceUrl}/reservations/court/${id}/available?date=${today}`),
      ]);

      if (courtRes.status === 404) {
        reply.status(404);
        return { error: 'Court not found' };
      }

      const court = await courtRes.json();
      const availability = slotsRes.ok ? await slotsRes.json() : { slots: [] };

      return {
        ...court as object,
        availability: (availability as any).slots,
      };
    },
  );
};

export default courts;
