import { db } from "@/lib/db";
import { type JobStatus } from "@/lib/constants";
import { createNotification } from "./notification-service";

export interface JobInput {
  title: string;
  companyId?: string | null;
  description?: string | null;
  url?: string | null;
  salary?: string | null;
  salaryAmount?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  location?: string | null;
  source?: string | null;
  status?: JobStatus;
  cvId?: string | null;
  currentStage?: string | null;
}

export function listJobs(userId: string) {
  return db.job.findMany({
    where: { userId },
    include: { company: true },
    orderBy: [{ status: "asc" }, { boardOrder: "asc" }],
  });
}

export function getJob(userId: string, id: string) {
  return db.job.findFirst({
    where: { id, userId },
    include: { company: true, interviews: true, notes: true },
  });
}

export function createJob(userId: string, input: JobInput) {
  return db.job.create({
    data: { ...input, userId },
  });
}

export async function updateJob(userId: string, id: string, input: Partial<JobInput>) {
  const before = await db.job.findFirst({ where: { id, userId } });
  await db.job.updateMany({ where: { id, userId }, data: input });
  const after = await db.job.findFirst({ where: { id, userId } });

  if (before && after) {
    if (input.status !== undefined && before.status !== after.status) {
      await createNotification(userId, {
        kind: "STATUS_CHANGE",
        title: `${after.title}: ${before.status} → ${after.status}`,
        jobId: after.id,
      });
    }
    if (
      input.currentStage !== undefined &&
      before.currentStage !== after.currentStage &&
      after.currentStage
    ) {
      await createNotification(userId, {
        kind: "STAGE_CHANGE",
        title: `${after.title} advanced to ${after.currentStage}`,
        jobId: after.id,
      });
    }
  }
  return after;
}

export async function updateJobStatus(
  userId: string,
  id: string,
  status: JobStatus,
  boardOrder: number
) {
  const current = await db.job.findFirst({ where: { id, userId } });
  const enteringApplied = status === "APPLIED" && current?.appliedAt == null;

  await db.job.updateMany({
    where: { id, userId },
    data: {
      status,
      boardOrder,
      ...(enteringApplied ? { appliedAt: new Date() } : {}),
    },
  });

  if (current && current.status !== status) {
    await createNotification(userId, {
      kind: "STATUS_CHANGE",
      title: `${current.title}: ${current.status} → ${status}`,
      jobId: id,
    });
  }
  return db.job.findFirst({ where: { id, userId } });
}

export function deleteJob(userId: string, id: string) {
  return db.job.deleteMany({ where: { id, userId } });
}

export async function reorderJobs(
  userId: string,
  items: { id: string; status: string; boardOrder: number }[]
) {
  await db.$transaction(
    items.map((it) =>
      db.job.updateMany({
        where: { id: it.id, userId },
        data: { status: it.status, boardOrder: it.boardOrder },
      })
    )
  );
}

export function listRecentJobs(userId: string, limit: number) {
  return db.job.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
