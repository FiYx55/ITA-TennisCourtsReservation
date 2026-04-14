import { Request, Response } from 'express';

import { createUser, verifyUser, getUser } from '@src/grpc/userClient';

// POST /auth/register
async function register(req: Request, res: Response) {
  const { email, firstName, lastName, password } = req.body;
  try {
    const user = await createUser({ email, firstName, lastName, password });
    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.details || 'Registration failed' });
  }
}

// POST /auth/login — aggregates VerifyUser + GetUser
async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const verification = await verifyUser({ email, password });
    if (!verification.valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const user = await getUser({ id: verification.userId });
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      role: user.role,
    });
  } catch (err: any) {
    res.status(401).json({ error: err?.details || 'Login failed' });
  }
}

export default { register, login } as const;
