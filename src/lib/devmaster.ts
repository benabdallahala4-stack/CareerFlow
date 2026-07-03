// Integration with DevMaster Hub (Angular interview-prep app).
// Builds deep links into its Interview Mode, pre-filtered by category + seniority.
//
// The base URL is configurable so we can point at a deployed instance later without
// code changes — set NEXT_PUBLIC_DEVMASTER_URL in the environment.
export const DEVMASTER_URL =
  process.env.NEXT_PUBLIC_DEVMASTER_URL?.replace(/\/$/, "") ?? "http://localhost:4200";

// DevMaster's real interview-question categories (case-insensitive match on its side).
type DevMasterCategory =
  | "Frontend"
  | "Backend"
  | "DevOps"
  | "Cloud"
  | "Architecture"
  | "Interview Prep";

type DevMasterLevel = "junior" | "mid" | "senior";

const SENIOR = /\b(senior|sr|lead|staff|principal|architect|head|director)\b/i;
const JUNIOR = /\b(junior|jr|intern|internship|entry|graduate|grad|trainee|apprentice)\b/i;

/** Best-effort seniority guess from a job title; defaults to mid. */
function inferLevel(jobTitle: string): DevMasterLevel {
  if (SENIOR.test(jobTitle)) return "senior";
  if (JUNIOR.test(jobTitle)) return "junior";
  return "mid";
}

const CATEGORY_PATTERNS: [RegExp, DevMasterCategory][] = [
  [/\b(devops|sre|platform|infrastructure|kubernetes|k8s|ci\/cd|terraform)\b/i, "DevOps"],
  [/\b(cloud|aws|azure|gcp)\b/i, "Cloud"],
  [/\b(architect|architecture)\b/i, "Architecture"],
  [/\b(frontend|front-end|react|angular|vue|svelte|ui|css|web)\b/i, "Frontend"],
  [/\b(backend|back-end|api|node|java|python|golang|\bgo\b|rails|ruby|php|\.net|spring|data|ml)\b/i, "Backend"],
];

/** Map (interview type, job title) to a DevMaster category, or null to leave it unfiltered. */
function inferCategory(interviewType: string, jobTitle: string): DevMasterCategory | null {
  // HR / behavioural rounds map to the Interview Prep category regardless of role.
  if (interviewType === "HR") return "Interview Prep";
  for (const [re, category] of CATEGORY_PATTERNS) {
    if (re.test(jobTitle)) return category;
  }
  return null;
}

/**
 * Build a deep link into DevMaster's Interview Mode tailored to this interview.
 * `autostart=1` kicks off a mock session immediately once content loads.
 */
export function buildInterviewPrepUrl(interviewType: string, jobTitle: string): string {
  const params = new URLSearchParams({ level: inferLevel(jobTitle), autostart: "1" });
  const category = inferCategory(interviewType, jobTitle);
  if (category) params.set("category", category);
  return `${DEVMASTER_URL}/interview?${params.toString()}`;
}
