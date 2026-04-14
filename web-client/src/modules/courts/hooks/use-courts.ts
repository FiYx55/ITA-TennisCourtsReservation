"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Court, CourtWithAvailability } from "../types";

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Court[]>("/courts");
      setCourts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch courts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourts(); }, [fetchCourts]);

  return { courts, isLoading, error, refetch: fetchCourts };
}

export function useCourtDetail(id: string) {
  const [court, setCourt] = useState<CourtWithAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        const data = await api.get<CourtWithAvailability>(`/courts/${id}`);
        setCourt(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch court");
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [id]);

  return { court, isLoading, error };
}
