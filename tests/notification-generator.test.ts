import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { generateDueNotifications } from "@/services/notification-generator";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

async function cleanup() {
  await db.notification.deleteMany({ where: { userId: U } });
  await db.interview.deleteMany({ where: { job: { title: { startsWith: "TEST_G_" } } } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_G_" } } });
}

beforeEach(async () => {
  await ensureUser();
  await cleanup();
});

afterEach(cleanup);

describe("generateDueNotifications", () => {
  it("creates both 24h and 1h reminders for an interview 30 min out, once", async () => {
    const now = new Date();
    const job = await db.job.create({ data: { userId: U, title: "TEST_G_soon", status: "INTERVIEW" } });
    await db.interview.create({
      data: { userId: U, jobId: job.id, type: "TECHNICAL", scheduledAt: new Date(now.getTime() + 30 * 60 * 1000) },
    });

    await generateDueNotifications(U, now);
    let reminders = await db.notification.findMany({ where: { userId: U, kind: "REMINDER" } });
    expect(reminders.length).toBe(2);

    // second run — dedupe, still 2
    await generateDueNotifications(U, now);
    reminders = await db.notification.findMany({ where: { userId: U, kind: "REMINDER" } });
    expect(reminders.length).toBe(2);
  });

  it("creates only the 24h reminder for an interview 10h out", async () => {
    const now = new Date();
    const job = await db.job.create({ data: { userId: U, title: "TEST_G_far", status: "INTERVIEW" } });
    await db.interview.create({
      data: { userId: U, jobId: job.id, type: "ONSITE", scheduledAt: new Date(now.getTime() + 10 * 60 * 60 * 1000) },
    });

    await generateDueNotifications(U, now);
    const reminders = await db.notification.findMany({ where: { userId: U, kind: "REMINDER" } });
    expect(reminders.length).toBe(1);
    expect(reminders[0].dedupeKey?.startsWith("rem24-")).toBe(true);
  });
});
