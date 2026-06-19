import type { JobStatus } from "@/lib/constants";

export type EmailClass = "INTERVIEW" | "REJECTION" | "OFFER" | "OTHER";

const REJECTION = [
  "unfortunately",
  "not moving forward",
  "not move forward",
  "will not be moving",
  "won't be moving",
  "regret to inform",
  "not selected",
  "other candidates",
  "position has been filled",
  "decided to proceed with other",
];

const OFFER = [
  "pleased to offer",
  "we are offering",
  "offer of employment",
  "job offer",
  "compensation package",
  "extend an offer",
];

const INTERVIEW = [
  "interview",
  "schedule a call",
  "schedule a time",
  "your availability",
  "meet the team",
  "next steps",
  "phone screen",
  "technical screen",
  "book a time",
  "set up a call",
  "speak with you",
];

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/** Rule-based classification. Precedence: rejection → offer → interview → other. */
export function classifyEmail(subject: string, body: string): EmailClass {
  const t = `${subject}\n${body}`.toLowerCase();
  if (hasAny(t, REJECTION)) return "REJECTION";
  if (hasAny(t, OFFER)) return "OFFER";
  if (hasAny(t, INTERVIEW)) return "INTERVIEW";
  return "OTHER";
}

export function proposedStatusFor(c: EmailClass): JobStatus | null {
  switch (c) {
    case "INTERVIEW":
      return "INTERVIEW";
    case "REJECTION":
      return "REJECTED";
    case "OFFER":
      return "OFFER";
    default:
      return null;
  }
}
