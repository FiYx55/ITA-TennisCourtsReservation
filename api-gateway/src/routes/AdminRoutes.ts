import { Request, Response } from 'express';

import { courtFetch, reservationFetch, userGrpcCall } from '@src/common/breaker';
import { getUsers } from '@src/grpc/userClient';

// GET /admin/dashboard — aggregated admin overview:
// user count + court count + today's reservation count.
// Each downstream call is independently breakered: if one is open we still
// return a partial dashboard rather than failing the whole request.
async function dashboard(_req: Request, res: Response) {
  const today = new Date().toISOString().split('T')[0];

  const [usersResult, courtsRes, reservationsRes] = await Promise.all([
    userGrpcCall(() => getUsers({} as never)).catch(() => ({ users: [] })),
    courtFetch('/courts').catch(() => null),
    reservationFetch('/reservations').catch(() => null),
  ]);

  const courts = courtsRes?.ok ? (await courtsRes.json() as any[]) : [];
  const reservations = reservationsRes?.ok ? (await reservationsRes.json() as any[]) : [];

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
