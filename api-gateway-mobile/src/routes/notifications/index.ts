import { type FastifyPluginAsync } from 'fastify';
import { config } from '../../config/index';

const notifications: FastifyPluginAsync = async (fastify): Promise<void> => {
  // GET /notifications/:userId — get user's notifications
  fastify.get(
    '/:userId',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Get all notifications for a user',
        params: {
          type: 'object',
          properties: { userId: { type: 'string', format: 'uuid' } },
          required: ['userId'],
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const res = await fetch(`${config.notificationServiceUrl}/notifications/${userId}`);
      reply.status(res.status);
      return res.json();
    },
  );

  // GET /notifications/:userId/unread/count — unread count
  fastify.get(
    '/:userId/unread/count',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        params: {
          type: 'object',
          properties: { userId: { type: 'string', format: 'uuid' } },
          required: ['userId'],
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const res = await fetch(
        `${config.notificationServiceUrl}/notifications/${userId}/unread/count`,
      );
      reply.status(res.status);
      return res.json();
    },
  );

  // PATCH /notifications/:id/read — mark as read
  fastify.patch(
    '/:id/read',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Mark a notification as read',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const res = await fetch(
        `${config.notificationServiceUrl}/notifications/${id}/read`,
        { method: 'PATCH' },
      );
      reply.status(res.status);
      return res.json();
    },
  );
};

export default notifications;
