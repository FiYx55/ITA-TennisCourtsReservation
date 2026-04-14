"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Reservation, CreateReservationInput } from "../types";

export function useUserReservations(userId: string | undefined) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Reservation[]>(`/reservations/user/${userId}`);
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reservations");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  return { reservations, isLoading, error, refetch: fetchReservations };
}

export function useCreateReservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateReservationInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post<Reservation>("/reservations", input);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create reservation";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

export function useCancelReservation() {
  const [isLoading, setIsLoading] = useState(false);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/reservations/${id}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { cancel, isLoading };
}

export function useAvailableSlots(courtId: string, date: string) {
  const [slots, setSlots] = useState<{ startTime: string; available: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        const data = await api.get<{ slots: { startTime: string; available: boolean }[] }>(
          `/reservations/court/${courtId}/available?date=${date}`
        );
        setSlots(data.slots);
      } catch {
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    }
    if (courtId && date) fetch();
  }, [courtId, date]);

  return { slots, isLoading };
}
