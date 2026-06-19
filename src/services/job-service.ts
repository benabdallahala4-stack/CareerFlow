import { db } from "@/lib/db";
import { type JobStatus } from "@/lib/constants";

export interface JobInput {
  title: string;
  companyId?: string | null;
  description?: string | null;
  url?: string | null;
  salary?: string | null;
  location?: string | null;
  source?: string | null;
  status?: JobStatus;
  cvId?: string | null;
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
  await db.job.updateMany({ where: { id, userId }, data: input });
  return db.job.findFirst({ where: { id, userId } });
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
  return db.job.findFirst({ where: { id, userId } });
}

export function deleteJob(userId: string, id: string) {
  return db.job.deleteMany({ where: { id, userId } });
}
