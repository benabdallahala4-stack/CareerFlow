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
