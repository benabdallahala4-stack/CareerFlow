import { db } from "@/lib/db";

export type NudgeKind = "FOLLOW_UP" | "ADD_PREP" | "TAG_CV";

export interface Nudge {
  kind: NudgeKind;
  message: string;
  jobId: string;
  jobTitle: string;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function computeNudges(userId: string): Promise<Nudge[]> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);

  const jobs = await db.job.findMany({
    where: { userId },
    select: { id: true, title: true, status: true, cvId: true, updatedAt: true },
  });

  const nudges: Nudge[] = [];

  for (const j of jobs) {
    if ((j.status === "APPLIED" || j.status === "INTERVIEW") && j.updatedAt < weekAgo) {
      nudges.push({
        kind: "FOLLOW_UP",
        message: `Follow up on ${j.title} — no activity in over a week.`,
        jobId: j.id,
        jobTitle: j.title,
      });
    }
    if ((j.status === "INTERVIEW" || j.status === "OFFER") && !j.cvId) {
      nudges.push({
        kind: "TAG_CV",
        message: `Tag a CV to ${j.title}.`,
        jobId: j.id,
        jobTitle: j.title,
      });
    }
  }

  const interviews = await db.interview.findMany({
    where: { userId, scheduledAt: { gt: now } },
    include: { job: { select: { id: true, title: true } } },
  });

  for (const iv of interviews) {
    if (!iv.prepNotes || !iv.prepNotes.trim()) {
      nudges.push({
        kind: "ADD_PREP",
        message: `Add prep notes for your ${iv.type} interview at ${iv.job.title}.`,
        jobId: iv.job.id,
        jobTitle: iv.job.title,
      });
    }
  }

  return nudges.slice(0, 8);
}
