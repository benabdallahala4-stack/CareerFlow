import { db } from "@/lib/db";
import { LOCAL_USER_ID, type JobStatus } from "@/lib/constants";

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

export function listJobs() {
  return db.job.findMany({
    where: { userId: LOCAL_USER_ID },
    include: { company: true },
    orderBy: [{ status: "asc" }, { boardOrder: "asc" }],
  });
}

export function getJob(id: string) {
  return db.job.findFirst({
    where: { id, userId: LOCAL_USER_ID },
    include: { company: true, interviews: true, notes: true },
  });
}

export function createJob(input: JobInput) {
  return db.job.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateJob(id: string, input: Partial<JobInput>) {
  return db.job.update({ where: { id }, data: input });
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  boardOrder: number
) {
  const current = await db.job.findUnique({ where: { id } });
  const enteringApplied = status === "APPLIED" && current?.appliedAt == null;

  return db.job.update({
    where: { id },
    data: {
      status,
      boardOrder,
      ...(enteringApplied ? { appliedAt: new Date() } : {}),
    },
  });
}

export function deleteJob(id: string) {
  return db.job.delete({ where: { id } });
}
