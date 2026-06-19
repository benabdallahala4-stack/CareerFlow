import { db } from "@/lib/db";
import { JOB_STATUSES, type JobStatus } from "@/lib/constants";

export interface Stats {
  total: number;
  byStatus: Record<JobStatus, number>;
  responseRate: number; // percent 0..100
  offers: number;
  interviewsThisWeek: number;
}

export async function computeStats(userId: string): Promise<Stats> {
  const jobs = await db.job.findMany({
    where: { userId },
    select: { status: true },
  });

  const byStatus = Object.fromEntries(
    JOB_STATUSES.map((s) => [s, 0])
  ) as Record<JobStatus, number>;
  for (const j of jobs) {
    const s = j.status as JobStatus;
    if (s in byStatus) byStatus[s] += 1;
  }

  const appliedOrFurther =
    byStatus.APPLIED + byStatus.INTERVIEW + byStatus.OFFER + byStatus.REJECTED;
  const responded = byStatus.INTERVIEW + byStatus.OFFER;
  const responseRate =
    appliedOrFurther === 0 ? 0 : Math.round((responded / appliedOrFurther) * 100);

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const interviewsThisWeek = await db.interview.count({
    where: {
      userId,
      scheduledAt: { gte: now, lte: weekAhead },
    },
  });

  return {
    total: jobs.length,
    byStatus,
    responseRate,
    offers: byStatus.OFFER,
    interviewsThisWeek,
  };
}
