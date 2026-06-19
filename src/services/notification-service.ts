import { db } from "@/lib/db";

export type NotificationKind =
  | "STAGE_CHANGE"
  | "STATUS_CHANGE"
  | "REMINDER"
  | "NUDGE"
  | "RECRUITER_REPLY"
  | "GENERIC";

export interface NotificationInput {
  kind: NotificationKind;
  title: string;
  body?: string | null;
  jobId?: string | null;
  dedupeKey?: string | null;
}

/**
 * Create a notification. Idempotent when dedupeKey is provided: if a row already
 * exists for (userId, dedupeKey), returns it without creating a duplicate.
 */
export async function createNotification(userId: string, input: NotificationInput) {
  if (input.dedupeKey) {
    const existing = await db.notification.findUnique({
      where: { userId_dedupeKey: { userId, dedupeKey: input.dedupeKey } },
    });
    if (existing) return existing;
  }
  return db.notification.create({
    data: {
      userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      jobId: input.jobId ?? null,
      dedupeKey: input.dedupeKey ?? null,
    },
  });
}

export function listNotifications(userId: string, limit = 30) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, read: false } });
}

export function markRead(userId: string, id: string) {
  return db.notification.updateMany({ where: { id, userId }, data: { read: true } });
}

export function markAllRead(userId: string) {
  return db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
