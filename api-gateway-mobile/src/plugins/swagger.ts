import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Tennis Courts - Mobile API Gateway',
        description: 'Mobile API gateway exposing a limited subset of the Tennis Court Reservation API. Focused on user-facing features: viewing courts, managing reservations, and notifications.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Courts', description: 'Browse available tennis courts' },
        { name: 'Reservations', description: 'Create and manage reservations' },
        { name: 'Notifications', description: 'View and manage notifications' },
        { name: 'Health', description: 'Service health check' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
});
