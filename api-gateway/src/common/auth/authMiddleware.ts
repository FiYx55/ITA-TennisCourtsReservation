import { NextFunction, Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';

import { AuthTokenPayload, verifyToken } from './jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    next();
  } catch {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(HttpStatusCodes.FORBIDDEN).json({ error: 'Insufficient role' });
      return;
    }
    next();
  };
}
