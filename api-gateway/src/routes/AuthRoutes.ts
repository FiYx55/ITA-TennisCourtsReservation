import { Request, Response } from 'express';

import { signToken } from '@src/common/auth/jwt';
import { userGrpcCall } from '@src/common/breaker';
import { createUser, verifyUser, getUser } from '@src/grpc/userClient';

// POST /auth/register
async function register(req: Request, res: Response) {
  const { email, firstName, lastName, password } = req.body;
  try {
    const user = await userGrpcCall(() => createUser({ email, firstName, lastName, password }));
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.details || 'Registration failed' });
  }
}

// POST /auth/login — aggregates VerifyUser + GetUser
async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const verification = await userGrpcCall(() => verifyUser({ email, password }));
    if (!verification.valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const user = await userGrpcCall(() => getUser({ id: verification.userId }));
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(401).json({ error: err?.details || 'Login failed' });
  }
}

export default { register, login } as const;
