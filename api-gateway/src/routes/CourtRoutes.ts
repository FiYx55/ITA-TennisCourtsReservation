import { Request, Response } from 'express';

import EnvVars from '@src/common/constants/env';

const courtUrl = () => EnvVars.CourtServiceUrl;
const reservationUrl = () => EnvVars.ReservationServiceUrl;

// GET /courts — list all courts
async function getAll(_req: Request, res: Response) {
  const r = await fetch(`${courtUrl()}/courts`);
  res.status(r.status).json(await r.json());
}

// GET /courts/:id — aggregated: court details + today's available slots
async function getOne(req: Request, res: Response) {
  const { id } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const [courtRes, slotsRes] = await Promise.all([
    fetch(`${courtUrl()}/courts/${id}`),
    fetch(`${reservationUrl()}/reservations/court/${id}/available?date=${today}`),
  ]);

  if (courtRes.status === 404) {
    res.status(404).json({ error: 'Court not found' });
    return;
  }

  const court = await courtRes.json();
  const availability = slotsRes.ok ? await slotsRes.json() : { slots: [] };

  res.json({ ...court as object, availability: (availability as any).slots });
}

// POST /courts — create court (admin)
async function create(req: Request, res: Response) {
  const r = await fetch(`${courtUrl()}/courts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
}

// PUT /courts/:id — update court (admin)
async function update(req: Request, res: Response) {
  const r = await fetch(`${courtUrl()}/courts/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
}

// DELETE /courts/:id — delete court (admin)
async function delete_(req: Request, res: Response) {
  const r = await fetch(`${courtUrl()}/courts/${req.params.id}`, {
    method: 'DELETE',
  });
  res.status(r.status).end();
}

export default { getAll, getOne, create, update, delete: delete_ } as const;
