import { Request, Response } from 'express';

import EnvVars from '@src/common/constants/env';
import { getUser } from '@src/grpc/userClient';

const courtUrl = () => EnvVars.CourtServiceUrl;
const reservationUrl = () => EnvVars.ReservationServiceUrl;

async function enrichWithCourt(reservation: any): Promise<any> {
  try {
    const r = await fetch(`${courtUrl()}/courts/${reservation.courtId}`);
    if (r.ok) {
      const court = await r.json() as any;
      return { ...reservation, courtName: court.name, courtSurface: court.surface };
    }
  } catch { /* best-effort */ }
  return reservation;
}

async function enrichWithUser(reservation: any): Promise<any> {
  try {
    const user = await getUser({ id: reservation.userId });
    return { ...reservation, userName: `${user.firstName} ${user.lastName}` };
  } catch { /* best-effort */ }
  return reservation;
}

// GET /reservations — admin: all reservations enriched with court + user names
async function getAll(_req: Request, res: Response) {
  const r = await fetch(`${reservationUrl()}/reservations`);
  if (!r.ok) {
    res.status(r.status).json(await r.json());
    return;
  }
  const items = await r.json() as any[];
  const enriched = await Promise.all(
    items.map(async (item) => enrichWithUser(await enrichWithCourt(item))),
  );
  res.json(enriched);
}

// GET /reservations/:id — aggregated: reservation + court + user
async function getOne(req: Request, res: Response) {
  const r = await fetch(`${reservationUrl()}/reservations/${req.params.id}`);
  if (r.status === 404) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  let reservation = await r.json();
  reservation = await enrichWithCourt(reservation);
  reservation = await enrichWithUser(reservation);
  res.json(reservation);
}

// GET /reservations/user/:userId — aggregated: user's reservations + court names
async function byUser(req: Request, res: Response) {
  const r = await fetch(`${reservationUrl()}/reservations/user/${req.params.userId}`);
  res.status(r.status);
  const items = await r.json() as any[];
  const enriched = await Promise.all(items.map(enrichWithCourt));
  res.json(enriched);
}

// GET /reservations/court/:courtId/available — available time slots
async function available(req: Request, res: Response) {
  const { courtId } = req.params;
  const date = req.query.date as string;
  const r = await fetch(
    `${reservationUrl()}/reservations/court/${courtId}/available?date=${date}`,
  );
  res.status(r.status).json(await r.json());
}

// POST /reservations — orchestrated: verify court exists, then create
async function create(req: Request, res: Response) {
  const body = req.body;

  // Step 1: verify court exists
  const courtRes = await fetch(`${courtUrl()}/courts/${body.courtId}`);
  if (!courtRes.ok) {
    res.status(404).json({ error: 'Court not found' });
    return;
  }
  const court = await courtRes.json() as any;

  // Step 2: create reservation
  const r = await fetch(`${reservationUrl()}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const reservation = await r.json();
  if (!r.ok) {
    res.status(r.status).json(reservation);
    return;
  }

  res.status(201).json({
    ...reservation as object,
    courtName: court.name,
    courtSurface: court.surface,
  });
}

// PUT /reservations/:id — admin: update reservation
async function update(req: Request, res: Response) {
  const r = await fetch(`${reservationUrl()}/reservations/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
}

// DELETE /reservations/:id — cancel reservation
async function delete_(req: Request, res: Response) {
  const r = await fetch(`${reservationUrl()}/reservations/${req.params.id}`, {
    method: 'DELETE',
  });
  res.status(r.status);
  if (r.status === 204) {
    res.end();
    return;
  }
  res.json(await r.json());
}

export default { getAll, getOne, byUser, available, create, update, delete: delete_ } as const;
