import { Request, Response } from 'express';

import EnvVars from '@src/common/constants/env';
import { getUsers } from '@src/grpc/userClient';

// GET /admin/dashboard — aggregated admin overview:
// user count + court count + today's reservation count
async function dashboard(_req: Request, res: Response) {
  const today = new Date().toISOString().split('T')[0];

  const [usersResult, courtsRes, reservationsRes] = await Promise.all([
    getUsers({} as never).catch(() => ({ users: [] })),
    fetch(`${EnvVars.CourtServiceUrl}/courts`).catch(() => null),
    fetch(`${EnvVars.ReservationServiceUrl}/reservations`).catch(() => null),
  ]);

  const courts = courtsRes?.ok ? (await courtsRes.json() as any[]) : [];
  const reservations = reservationsRes?.ok ? (await reservationsRes.json() as any[]) : [];

  // Filter today's reservations
  const todaysReservations = reservations.filter((r: any) => {
    const start = new Date(r.startTime).toISOString().split('T')[0];
    return start === today;
  });

  res.json({
    userCount: usersResult.users.length,
    courtCount: courts.length,
    totalReservations: reservations.length,
    todaysReservations: todaysReservations.length,
  });
}

export default { dashboard } as const;
