"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Notification } from "../types";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await api.get<Notification[]>(`/notifications/${userId}`);
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  return { notifications, isLoading, markAsRead, refetch: fetchNotifications };
}

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.get<{ count: number }>(`/notifications/${userId}/unread/count`);
      setCount(data.count);
    } catch {
      setCount(0);
    }
  }, [userId]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  return { count, refetch: fetchCount };
}
