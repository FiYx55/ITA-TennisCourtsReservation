import { type FastifyPluginAsync } from 'fastify';
import { createUser, verifyUser, getUser } from '../../grpc/userClient';

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  // POST /auth/register — create a new user
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a new user',
        body: {
          type: 'object',
          required: ['email', 'firstName', 'lastName', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, firstName, lastName, password } = request.body as any;
      try {
        const user = await createUser({ email, firstName, lastName, password });
        reply.status(201);
        return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
      } catch (err: any) {
        const message = err?.details || 'Registration failed';
        reply.status(400);
        return { error: message };
      }
    },
  );

  // POST /auth/login — verify credentials, return full profile
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Login — verify credentials and return user profile',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as any;
      try {
        // Step 1: verify credentials
        const verification = await verifyUser({ email, password });
        if (!verification.valid) {
          reply.status(401);
          return { error: 'Invalid credentials' };
        }
        // Step 2: fetch full user profile
        const user = await getUser({ id: verification.userId });
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          role: user.role,
        };
      } catch (err: any) {
        const message = err?.details || 'Login failed';
        reply.status(401);
        return { error: message };
      }
    },
  );
};

export default auth;
