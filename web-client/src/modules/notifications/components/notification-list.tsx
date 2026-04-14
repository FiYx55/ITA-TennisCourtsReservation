"use client";

import { useNotifications } from "../hooks/use-notifications";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-5 w-2/3 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface NotificationListProps {
  userId: string;
}

export function NotificationList({ userId }: NotificationListProps) {
  const { notifications, isLoading, markAsRead } = useNotifications(userId);

  if (isLoading) {
    return <NotificationSkeleton />;
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No notifications yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={notification.isRead ? "opacity-75" : ""}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {notification.title}
              <Badge
                variant={notification.isRead ? "secondary" : "default"}
              >
                {notification.isRead ? "Read" : "Unread"}
              </Badge>
            </CardTitle>
            <CardAction>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(notification.createdAt)}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
            {!notification.isRead && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => markAsRead(notification.id)}
              >
                Mark as read
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
