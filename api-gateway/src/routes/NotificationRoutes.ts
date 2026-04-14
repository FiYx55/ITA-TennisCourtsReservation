import { Request, Response } from 'express';

import EnvVars from '@src/common/constants/env';

const notifUrl = () => EnvVars.NotificationServiceUrl;

// GET /notifications/:userId — get user's notifications
async function byUser(req: Request, res: Response) {
  const r = await fetch(`${notifUrl()}/notifications/${req.params.userId}`);
  res.status(r.status).json(await r.json());
}

// GET /notifications/:userId/unread/count — unread count
async function unreadCount(req: Request, res: Response) {
  const r = await fetch(
    `${notifUrl()}/notifications/${req.params.userId}/unread/count`,
  );
  res.status(r.status).json(await r.json());
}

// PATCH /notifications/:id/read — mark as read
async function markRead(req: Request, res: Response) {
  const r = await fetch(`${notifUrl()}/notifications/${req.params.id}/read`, {
    method: 'PATCH',
  });
  res.status(r.status).json(await r.json());
}

// DELETE /notifications/:id — admin: delete notification
async function delete_(req: Request, res: Response) {
  const r = await fetch(`${notifUrl()}/notifications/${req.params.id}`, {
    method: 'DELETE',
  });
  res.status(r.status);
  if (r.status === 204) {
    res.end();
    return;
  }
  res.json(await r.json());
}

// POST /notifications — admin: create notification
async function create(req: Request, res: Response) {
  const r = await fetch(`${notifUrl()}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
}

export default { byUser, unreadCount, markRead, delete: delete_, create } as const;
