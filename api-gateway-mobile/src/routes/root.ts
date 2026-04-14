import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Gateway health check',
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
    async () => ({ status: 'ok' }),
  );
};

export default root;
