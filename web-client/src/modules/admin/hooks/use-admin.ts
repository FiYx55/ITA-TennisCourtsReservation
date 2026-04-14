"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { DashboardStats, AdminUser } from "../types";
import type { Court } from "@/modules/courts/types";

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await api.get<DashboardStats>("/admin/dashboard");
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, []);

  return { stats, isLoading };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<AdminUser[]>("/users");
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    await api.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return { users, isLoading, deleteUser, refetch: fetchUsers };
}

export function useAdminCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Court[]>("/courts");
      setCourts(data);
    } catch {
      setCourts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourts(); }, [fetchCourts]);

  const createCourt = useCallback(async (body: Partial<Court>) => {
    const data = await api.post<Court>("/courts", body);
    setCourts((prev) => [...prev, data]);
    return data;
  }, []);

  const deleteCourt = useCallback(async (id: string) => {
    await api.delete(`/courts/${id}`);
    setCourts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { courts, isLoading, createCourt, deleteCourt, refetch: fetchCourts };
}
