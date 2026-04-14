import { type FastifyPluginAsync } from 'fastify';
import { config } from '../../config/index';
import { getUser } from '../../grpc/userClient';

const dashboard: FastifyPluginAsync = async (fastify): Promise<void> => {
  // GET /dashboard/:userId — aggregated mobile home screen
  // Combines: user profile + upcoming reservations (with court names) + unread notification count
  fastify.get(
    '/:userId',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Mobile home screen — profile, upcoming reservations, unread count',
        params: {
          type: 'object',
          properties: { userId: { type: 'string', format: 'uuid' } },
          required: ['userId'],
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      // Parallel: fetch user profile + reservations + unread count
      const [user, reservationsRes, unreadRes] = await Promise.all([
        getUser({ id: userId }).catch(() => null),
        fetch(`${config.reservationServiceUrl}/reservations/user/${userId}`),
        fetch(`${config.notificationServiceUrl}/notifications/${userId}/unread/count`),
      ]);

      if (!user) {
        reply.status(404);
        return { error: 'User not found' };
      }

      const reservations = reservationsRes.ok ? (await reservationsRes.json() as any[]) : [];
      const unread = unreadRes.ok ? (await unreadRes.json() as any) : { count: 0 };

      // Filter to upcoming reservations (startTime in the future)
      const now = new Date();
      const upcoming = reservations.filter(
        (r: any) => new Date(r.startTime) > now && r.status === 'confirmed',
      );

      // Enrich reservations with court names in parallel
      const enriched = await Promise.all(
        upcoming.map(async (r: any) => {
          try {
            const courtRes = await fetch(`${config.courtServiceUrl}/courts/${r.courtId}`);
            if (courtRes.ok) {
              const court = await courtRes.json() as any;
              return { ...r, courtName: court.name, courtSurface: court.surface };
            }
          } catch { /* best-effort */ }
          return r;
        }),
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        upcomingReservations: enriched,
        unreadNotificationCount: unread.count,
      };
    },
  );
};

export default dashboard;
