import fp from 'fastify-plugin';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import 'fastify';
import { config } from '../config/index';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    signToken: (user: { id: string; email: string; role: string }) => string;
    requireAuth: (
      req: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
    requireAdmin: (
      req: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user?: AuthTokenPayload;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('signToken', (user) => {
    const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, options);
  });

  fastify.decorate('requireAuth', async (req, reply) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Missing or invalid Authorization header' });
      return;
    }
    try {
      req.user = jwt.verify(header.slice(7), config.jwtSecret) as AuthTokenPayload;
    } catch {
      reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });

  fastify.decorate('requireAdmin', async (req, reply) => {
    await fastify.requireAuth(req, reply);
    if (reply.sent) return;
    if (req.user?.role !== 'admin') {
      reply.status(403).send({ error: 'Insufficient role' });
    }
  });
});
