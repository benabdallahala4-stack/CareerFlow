import { db } from "@/lib/db";
import { classifyEmail, proposedStatusFor } from "./classify";
import { matchJobForEmail } from "./match";
import { createNotification } from "../notification-service";

export interface IncomingEmail {
  from: string;
  subject: string;
  body: string;
}

export interface ProcessResult {
  classification: string;
  jobId: string | null;
  suggestionId: string | null;
}

/**
 * Classify an incoming email, match it to a job, and (if actionable + matched)
 * create a PENDING EmailSuggestion + a notification. Never changes job data
 * directly — the user confirms via the suggestion.
 */
export async function processIncomingEmail(
  userId: string,
  email: IncomingEmail
): Promise<ProcessResult> {
  const subject = email.subject ?? "";
  const body = email.body ?? "";
  const from = email.from ?? "";

  const classification = classifyEmail(subject, body);
  const proposed = proposedStatusFor(classification);
  if (!proposed) return { classification, jobId: null, suggestionId: null };

  const jobId = await matchJobForEmail(userId, from, subject, body);
  if (!jobId) return { classification, jobId: null, suggestionId: null };

  const existing = await db.emailSuggestion.findFirst({
    where: { userId, jobId, classification, status: "PENDING", subject },
  });
  if (existing) return { classification, jobId, suggestionId: existing.id };

  const job = await db.job.findFirst({
    where: { id: jobId, userId },
    include: { company: true },
  });

  const suggestion = await db.emailSuggestion.create({
    data: {
      userId,
      jobId,
      classification,
      proposedStatus: proposed,
      fromEmail: from || null,
      subject: subject || null,
      snippet: body.slice(0, 160) || null,
    },
  });

  const label =
    classification === "INTERVIEW"
      ? "Possible interview"
      : classification === "OFFER"
      ? "Possible offer"
      : "Possible rejection";

  await createNotification(userId, {
    kind: "RECRUITER_REPLY",
    title: `${label} from ${job?.company?.name ?? "a company"}`,
    body: subject || null,
    jobId,
  });

  return { classification, jobId, suggestionId: suggestion.id };
}
