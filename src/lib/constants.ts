export const LOCAL_USER_ID = "local-user";

export const SALARY_CURRENCIES = [
  { value: "EUR", symbol: "€", label: "EUR €" },
  { value: "USD", symbol: "$", label: "USD $" },
] as const;

export const SALARY_PERIODS = [
  { value: "YEAR", label: "per year" },
  { value: "MONTH", label: "per month" },
] as const;

export function formatSalary(
  amount?: number | null,
  currency?: string | null,
  period?: string | null,
  fallback?: string | null
): string | null {
  if (!amount) return fallback ?? null;
  const sym = currency === "USD" ? "$" : "€";
  const per = period === "MONTH" ? "month" : "year";
  return `${sym}${amount.toLocaleString()} / ${per} gross`;
}

export const JOB_STATUSES = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

// Columns shown on the Kanban board (ARCHIVED hidden by default)
export const BOARD_COLUMNS: JobStatus[] = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

// Display metadata per status: human label + Tailwind color classes.
export const STATUS_META: Record<
  JobStatus,
  { label: string; dot: string; badge: string }
> = {
  WISHLIST: { label: "Wishlist", dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600" },
  APPLIED: { label: "Applied", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-600" },
  INTERVIEW: { label: "Interview", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-600" },
  OFFER: { label: "Offer", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-600" },
  REJECTED: { label: "Rejected", dot: "bg-rose-400", badge: "bg-rose-50 text-rose-500" },
  ARCHIVED: { label: "Archived", dot: "bg-zinc-300", badge: "bg-zinc-100 text-zinc-400" },
};

export const INTERVIEW_TYPES = [
  "PHONE",
  "TECHNICAL",
  "ONSITE",
  "HR",
  "FINAL",
] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_OUTCOMES = [
  "PENDING",
  "PASSED",
  "FAILED",
  "CANCELLED",
] as const;

export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];

export const INTERVIEW_STAGES = [
  "APPLIED",
  "SCREENING",
  "TECHNICAL",
  "ONSITE",
  "FINAL",
  "OFFER",
] as const;

export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

export const STAGE_META: Record<InterviewStage, { label: string; dot: string }> = {
  APPLIED: { label: "Applied", dot: "bg-zinc-400" },
  SCREENING: { label: "Screening", dot: "bg-blue-500" },
  TECHNICAL: { label: "Technical", dot: "bg-violet-500" },
  ONSITE: { label: "Onsite", dot: "bg-amber-500" },
  FINAL: { label: "Final", dot: "bg-orange-500" },
  OFFER: { label: "Offer", dot: "bg-emerald-500" },
};

// Map an interview type to its default stage.
export function stageForType(type: string): InterviewStage {
  switch (type) {
    case "TECHNICAL":
      return "TECHNICAL";
    case "ONSITE":
      return "ONSITE";
    case "FINAL":
      return "FINAL";
    case "PHONE":
    case "HR":
    default:
      return "SCREENING";
  }
}
