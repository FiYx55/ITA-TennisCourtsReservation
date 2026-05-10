import { Request, Response } from 'express';

import { courtFetch, reservationFetch } from '@src/common/breaker';

// GET /courts — list all courts
async function getAll(_req: Request, res: Response) {
  const r = await courtFetch('/courts');
  res.status(r.status).json(await r.json());
}

// GET /courts/:id — aggregated: court details + today's available slots
async function getOne(req: Request, res: Response) {
  const { id } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const [courtRes, slotsRes] = await Promise.all([
    courtFetch(`/courts/${id}`),
    reservationFetch(`/reservations/court/${id}/available?date=${today}`).catch(() => null),
  ]);

  if (courtRes.status === 404) {
    res.status(404).json({ error: 'Court not found' });
    return;
  }

  const court = await courtRes.json();
  const availability = slotsRes?.ok ? await slotsRes.json() : { slots: [] };

  res.json({ ...court as object, availability: (availability as any).slots });
}

// POST /courts — create court (admin)
async function create(req: Request, res: Response) {
  const r = await courtFetch('/courts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
}

// PUT /courts/:id — update court (admin)
async function update(req: Request, res: Response) {
  const r = await courtFetch(`/courts/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
}

// DELETE /courts/:id — delete court (admin)
async function delete_(req: Request, res: Response) {
  const r = await courtFetch(`/courts/${req.params.id}`, { method: 'DELETE' });
  res.status(r.status).end();
}

export default { getAll, getOne, create, update, delete: delete_ } as const;
