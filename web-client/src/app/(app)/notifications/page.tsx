"use client";

import { useAuth } from "@/lib/auth-context";
import { NotificationList } from "@/modules/notifications/components/notification-list";

export default function NotificationsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <NotificationList userId={user.id} />
    </div>
  );
}
