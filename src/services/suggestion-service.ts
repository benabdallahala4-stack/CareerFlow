import { db } from "@/lib/db";
import { updateJobStatus } from "./job-service";
import type { JobStatus } from "@/lib/constants";

export function listPendingSuggestions(userId: string) {
  return db.emailSuggestion.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function applySuggestion(userId: string, id: string) {
  const s = await db.emailSuggestion.findFirst({ where: { id, userId } });
  if (!s) return null;
  if (s.jobId) {
    await updateJobStatus(userId, s.jobId, s.proposedStatus as JobStatus, 0);
  }
  await db.emailSuggestion.updateMany({ where: { id, userId }, data: { status: "APPLIED" } });
  return db.emailSuggestion.findFirst({ where: { id, userId } });
}

export async function dismissSuggestion(userId: string, id: string) {
  await db.emailSuggestion.updateMany({ where: { id, userId }, data: { status: "DISMISSED" } });
  return db.emailSuggestion.findFirst({ where: { id, userId } });
}
