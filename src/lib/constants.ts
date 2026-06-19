export const LOCAL_USER_ID = "local-user";

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
