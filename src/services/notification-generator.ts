import { db } from "@/lib/db";
import { createNotification } from "./notification-service";
import { computeNudges } from "./nudge-service";

const HOUR_MS = 60 * 60 * 1000;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Generate all notifications currently due for a user: interview reminders
 * (24h and 1h before) and nudge notifications. Idempotent via dedupeKey, so it
 * is safe to call on a schedule. `now` is injected for deterministic tests.
 * Returns the number of create attempts (duplicates are no-ops).
 */
export async function generateDueNotifications(userId: string, now: Date): Promise<number> {
  let count = 0;

  const interviews = await db.interview.findMany({
    where: { userId, scheduledAt: { gt: now } },
    include: { job: { select: { id: true, title: true } } },
  });

  for (const iv of interviews) {
    if (!iv.scheduledAt) continue;
    const diff = new Date(iv.scheduledAt).getTime() - now.getTime();
    const when = new Date(iv.scheduledAt).toLocaleString();
    if (diff <= 24 * HOUR_MS) {
      await createNotification(userId, {
        kind: "REMINDER",
        title: `Interview soon: ${iv.job.title}`,
        body: `${iv.type} interview — ${when}`,
        jobId: iv.job.id,
        dedupeKey: `rem24-${iv.id}`,
      });
      count++;
    }
    if (diff <= 1 * HOUR_MS) {
      await createNotification(userId, {
        kind: "REMINDER",
        title: `Interview in ~1 hour: ${iv.job.title}`,
        body: `${iv.type} interview — ${when}`,
        jobId: iv.job.id,
        dedupeKey: `rem1-${iv.id}`,
      });
      count++;
    }
  }

  const nudges = await computeNudges(userId);
  for (const n of nudges) {
    await createNotification(userId, {
      kind: "NUDGE",
      title: n.message,
      jobId: n.jobId,
      dedupeKey: `nudge-${n.kind}-${n.jobId}-${ymd(now)}`,
    });
    count++;
  }

  return count;
}

/** Run generation for every user. Returns total attempts. */
export async function generateForAllUsers(now: Date): Promise<number> {
  const users = await db.user.findMany({ select: { id: true } });
  let total = 0;
  for (const u of users) {
    total += await generateDueNotifications(u.id, now);
  }
  return total;
}
