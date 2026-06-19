import { db } from "@/lib/db";
import { LOCAL_USER_ID, type InterviewType, type InterviewOutcome } from "@/lib/constants";

export interface InterviewInput {
  type: InterviewType;
  scheduledAt?: string | Date | null;
  durationMin?: number | null;
  location?: string | null;
  notes?: string | null;
  outcome?: InterviewOutcome;
  prepNotes?: string | null;
}

export function listInterviewsForJob(jobId: string) {
  return db.interview.findMany({
    where: { jobId, userId: LOCAL_USER_ID },
    orderBy: { scheduledAt: "asc" },
  });
}

export function createInterview(jobId: string, input: InterviewInput) {
  return db.interview.create({
    data: {
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      jobId,
      userId: LOCAL_USER_ID,
    },
  });
}

export function updateInterview(id: string, input: Partial<InterviewInput>) {
  const { scheduledAt, ...rest } = input;
  return db.interview.update({
    where: { id },
    data: {
      ...rest,
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
    },
  });
}

export function deleteInterview(id: string) {
  return db.interview.delete({ where: { id } });
}
