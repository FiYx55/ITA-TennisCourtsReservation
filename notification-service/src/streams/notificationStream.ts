import { Subject, type Observable } from "rxjs";
import { tap, mergeMap, filter } from "rxjs/operators";
import { Notification } from "../db/Notification.js";
import { publishNotification } from "../broker/index.js";
import { logger } from "../config/logger.js";

export interface NotificationEvent {
  userId: string;
  type: string;
  title: string;
  message: string;
}

export interface ProcessedNotification extends NotificationEvent {
  id: string;
  isRead: boolean;
  createdAt: Date;
}

// Reactive Subject — the entry point for all incoming notifications
const notificationSubject = new Subject<NotificationEvent>();

// Observable pipeline that processes notifications reactively
export const notification$: Observable<ProcessedNotification> = notificationSubject.pipe(
  // Log incoming event
  tap((event) =>
    logger.stream.info(`Received notification event for user ${event.userId} (${event.type})`)
  ),

  // Filter out events with empty messages
  filter((event) => event.message.trim().length > 0),

  // Persist to database (async operation via mergeMap)
  mergeMap(async (event) => {
    const record = await Notification.create({
      userId: event.userId,
      type: event.type,
      title: event.title,
      message: event.message,
    });

    logger.stream.info(`Persisted notification ${record.id}`);

    return {
      id: record.id,
      userId: record.userId,
      type: record.type,
      title: record.title,
      message: record.message,
      isRead: record.isRead,
      createdAt: record.createdAt,
    } as ProcessedNotification;
  }),

  // Publish to RabbitMQ as a side effect
  tap((notification) => {
    publishNotification({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });
  }),

  // Log completion
  tap((notification) =>
    logger.stream.info(`Notification ${notification.id} fully processed`)
  )
);

// Push a new event into the reactive stream
export function emitNotification(event: NotificationEvent): void {
  notificationSubject.next(event);
}
