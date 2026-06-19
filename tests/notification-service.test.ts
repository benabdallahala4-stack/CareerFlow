import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createNotification,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from "@/services/notification-service";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  await db.notification.deleteMany({ where: { userId: U } });
});

afterEach(async () => {
  await db.notification.deleteMany({ where: { userId: U } });
});

describe("NotificationService", () => {
  it("creates a notification and counts it as unread", async () => {
    await createNotification(U, { kind: "GENERIC", title: "Hi" });
    expect(await unreadCount(U)).toBe(1);
    const list = await listNotifications(U);
    expect(list[0].title).toBe("Hi");
  });

  it("is idempotent on dedupeKey", async () => {
    await createNotification(U, { kind: "REMINDER", title: "Rem", dedupeKey: "rem24-x" });
    await createNotification(U, { kind: "REMINDER", title: "Rem", dedupeKey: "rem24-x" });
    const list = await listNotifications(U);
    expect(list.length).toBe(1);
  });

  it("marks one and all read", async () => {
    const a = await createNotification(U, { kind: "GENERIC", title: "A" });
    await createNotification(U, { kind: "GENERIC", title: "B" });
    await markRead(U, a.id);
    expect(await unreadCount(U)).toBe(1);
    await markAllRead(U);
    expect(await unreadCount(U)).toBe(0);
  });
});
