"use client";

import { useAuth } from "@/lib/auth-context";
import { ReservationList } from "@/modules/reservations/components/reservation-list";

export default function ReservationsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Reservations</h1>
      <ReservationList userId={user.id} />
    </div>
  );
}
