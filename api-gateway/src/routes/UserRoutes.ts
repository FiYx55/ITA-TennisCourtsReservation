import { Request, Response } from 'express';

import { userGrpcCall } from '@src/common/breaker';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '@src/grpc/userClient';

// GET /users — list all users (admin)
async function getAll(_req: Request, res: Response) {
  try {
    const result = await userGrpcCall(() => getUsers({} as never));
    res.json(result.users);
  } catch (err: any) {
    res.status(502).json({ error: err?.details || err?.message || 'Failed to fetch users' });
  }
}

// GET /users/:id
async function getOne(req: Request, res: Response) {
  try {
    const user = await userGrpcCall(() => getUser({ id: req.params.id as string }));
    res.json(user);
  } catch (err: any) {
    res.status(404).json({ error: err?.details || err?.message || 'User not found' });
  }
}

// PUT /users/:id
async function update(req: Request, res: Response) {
  const { email, firstName, lastName } = req.body;
  try {
    const user = await userGrpcCall(() =>
      updateUser({ id: req.params.id as string, email, firstName, lastName }),
    );
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err?.details || err?.message || 'Update failed' });
  }
}

// DELETE /users/:id
async function delete_(req: Request, res: Response) {
  try {
    await userGrpcCall(() => deleteUser({ id: req.params.id as string }));
    res.status(204).end();
  } catch (err: any) {
    res.status(404).json({ error: err?.details || err?.message || 'User not found' });
  }
}

export default { getAll, getOne, update, delete: delete_ } as const;
