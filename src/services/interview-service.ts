import { db } from "@/lib/db";
import { type InterviewType, type InterviewOutcome } from "@/lib/constants";

export interface InterviewInput {
  type: InterviewType;
  scheduledAt?: string | Date | null;
  durationMin?: number | null;
  location?: string | null;
  notes?: string | null;
  outcome?: InterviewOutcome;
  prepNotes?: string | null;
}

export function listInterviewsForJob(userId: string, jobId: string) {
  return db.interview.findMany({
    where: { jobId, userId },
    orderBy: { scheduledAt: "asc" },
  });
}

export function createInterview(userId: string, jobId: string, input: InterviewInput) {
  return db.interview.create({
    data: {
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      jobId,
      userId,
    },
  });
}

export async function updateInterview(
  userId: string,
  id: string,
  input: Partial<InterviewInput>
) {
  const { scheduledAt, ...rest } = input;
  await db.interview.updateMany({
    where: { id, userId },
    data: {
      ...rest,
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
    },
  });
  return db.interview.findFirst({ where: { id, userId } });
}

export function deleteInterview(userId: string, id: string) {
  return db.interview.deleteMany({ where: { id, userId } });
}
