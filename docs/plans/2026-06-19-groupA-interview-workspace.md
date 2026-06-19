# Group A — Interview Workspace Implementation Plan

> **For agentic workers:** Execute task-by-task. TDD on services + AI fallback; UI via build + smoke.

**Goal:** Turn the job page into an interview workspace — hybrid stage stepper + interview timeline, AI company research (cached), and an in-app calendar.

**Architecture:** Additive Prisma fields + an ordered `INTERVIEW_STAGES` constant. Services stay `userId`-first. New AI feature `companyBrief` reuses the router with a rule-based fallback. New `/calendar` and `/api/ai/company-brief` routes. UI: `StageStepper`, `CompanyResearchPanel`, regrouped `InterviewSection`.

**Tech Stack:** Next.js 14 · Prisma 6 · Postgres · NextAuth · Vitest. No new deps.

**Env:** `wsl.exe bash -lc "cd /home/ala/gitlab/CareerFlow && <cmd>"`; Postgres up via `docker compose up -d`. Commit with `git -c user.name='Alabab95' -c user.email='benabdallahala4@gmail.com'`.

---

### Task 1: Stage constants

**Files:** Modify `src/lib/constants.ts`

- [ ] **Step 1: Append to `src/lib/constants.ts`**

```ts
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
    case "TECHNICAL": return "TECHNICAL";
    case "ONSITE": return "ONSITE";
    case "FINAL": return "FINAL";
    case "PHONE":
    case "HR":
    default: return "SCREENING";
  }
}
```

- [ ] **Step 2: Commit** `git add -A && git commit -m "feat(stages): add INTERVIEW_STAGES constants + stageForType"`

---

### Task 2: Schema migration

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1: Add fields.** In `model Job` add after `status` line: `currentStage String?`. In `model Interview` add after `type` line: `stage String?`. In `model Company` add after `notes` line: `aiBrief String?` and `aiBriefAt DateTime?`.

- [ ] **Step 2: Migrate**

```bash
npx prisma migrate dev --name interview_workspace
```

Expected: migration created + applied, client regenerated.

- [ ] **Step 3: Commit** `git add -A && git commit -m "feat(stages): schema — Job.currentStage, Interview.stage, Company.aiBrief"`

---

### Task 3: JobService + InterviewService (TDD)

**Files:** Modify `src/services/job-service.ts`, `src/services/interview-service.ts`; Test `tests/interview-service.test.ts`

- [ ] **Step 1: Add `currentStage` to `JobInput`** in `src/services/job-service.ts` (interface only — `updateJob` already spreads input):

```ts
  status?: JobStatus;
  cvId?: string | null;
  currentStage?: string | null;
```

- [ ] **Step 2: Write failing tests** — append inside `describe("InterviewService", ...)` in `tests/interview-service.test.ts`:

```ts
  it("defaults stage from type on create", async () => {
    const iv = await createInterview(U, jobId, { type: "TECHNICAL" });
    expect(iv.stage).toBe("TECHNICAL");
    const hr = await createInterview(U, jobId, { type: "HR" });
    expect(hr.stage).toBe("SCREENING");
  });

  it("lists interviews in a date range and upcoming", async () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await createInterview(U, jobId, { type: "PHONE", scheduledAt: soon });
    await createInterview(U, jobId, { type: "ONSITE", scheduledAt: far });

    const startISO = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const endISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inRange = await listInterviewsInRange(U, startISO, endISO);
    expect(inRange.some((i) => i.job.title === "TEST_IV_Job")).toBe(true);
    expect(inRange.length).toBe(1); // only the "soon" one

    const upcoming = await listUpcomingInterviews(U, 10);
    expect(upcoming.length).toBeGreaterThanOrEqual(2);
    expect(upcoming[0].job).toBeTruthy();
  });
```

And add these to the import at the top of the file:

```ts
import {
  createInterview,
  listInterviewsForJob,
  updateInterview,
  deleteInterview,
  listInterviewsInRange,
  listUpcomingInterviews,
} from "@/services/interview-service";
```

- [ ] **Step 3: Run — expect FAIL** `npx vitest run tests/interview-service.test.ts` (missing exports / stage undefined).

- [ ] **Step 4: Implement in `src/services/interview-service.ts`.** Add import at top:

```ts
import { stageForType } from "@/lib/constants";
```

In `createInterview`, set the stage default — change the `data` to:

```ts
  return db.interview.create({
    data: {
      ...input,
      stage: input.stage ?? stageForType(input.type),
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      jobId,
      userId,
    },
  });
```

Add `stage?: string | null;` to the `InterviewInput` interface. Then append two functions:

```ts
export function listInterviewsInRange(userId: string, startISO: string, endISO: string) {
  return db.interview.findMany({
    where: {
      userId,
      scheduledAt: { gte: new Date(startISO), lte: new Date(endISO) },
    },
    orderBy: { scheduledAt: "asc" },
    include: { job: { select: { id: true, title: true } } },
  });
}

export function listUpcomingInterviews(userId: string, limit: number) {
  return db.interview.findMany({
    where: { userId, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: limit,
    include: { job: { select: { id: true, title: true } } },
  });
}
```

- [ ] **Step 5: Run — expect PASS** `npx vitest run tests/interview-service.test.ts`

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(stages): default interview stage + range/upcoming queries (TDD)"`

---

### Task 4: Company-brief AI feature + fallback (TDD)

**Files:** Modify `src/services/ai/types.ts`, `src/services/ai/fallback.ts`, `src/services/ai/features.ts`; Test `tests/ai-fallback.test.ts`

- [ ] **Step 1: Add `"COMPANY"` to `AI_FEATURES`** in `src/services/ai/types.ts`:

```ts
export const AI_FEATURES = ["MATCH", "TAILOR", "PREP", "CHAT", "COMPANY"] as const;
```

- [ ] **Step 2: Write failing test** — append to `tests/ai-fallback.test.ts`:

```ts
import { companyBriefFallback } from "@/services/ai/fallback";

describe("companyBriefFallback", () => {
  it("returns a checklist covering the four research areas", () => {
    const t = companyBriefFallback("Acme");
    expect(t).toContain("Acme");
    expect(t.toLowerCase()).toContain("overview");
    expect(t.toLowerCase()).toContain("questions to ask");
  });
});
```

- [ ] **Step 3: Run — expect FAIL** `npx vitest run tests/ai-fallback.test.ts`

- [ ] **Step 4: Implement `companyBriefFallback` in `src/services/ai/fallback.ts`** (append):

```ts
export function companyBriefFallback(companyName: string): string {
  const c = companyName || "this company";
  return [
    `No AI key configured — here is a research checklist for ${c}:`,
    "",
    "Overview: visit their website + LinkedIn. What do they sell, who are their customers, how big are they?",
    "Recent news: search Google News + their blog for the last 3 months.",
    "Likely interview questions: review the job description and Glassdoor interview reviews for this company.",
    "Smart questions to ask them: team structure, success in 6 months, biggest current challenge, growth plans.",
    "Talking points: connect your experience to their product and a recent company milestone.",
  ].join("\n");
}
```

- [ ] **Step 5: Run — expect PASS** `npx vitest run tests/ai-fallback.test.ts`

- [ ] **Step 6: Add `companyBrief` to `src/services/ai/features.ts`** (append):

```ts
import { companyBriefFallback } from "./fallback";

export async function companyBrief(
  userId: string,
  companyName: string,
  website: string | null,
  role: string
): Promise<TextOutput> {
  const prompt = `Write a concise interview-prep brief for a candidate interviewing at "${companyName}"${
    website ? ` (${website})` : ""
  } for the role "${role}". Use exactly these four sections with headers:\n` +
    `1. Overview — what the company does.\n` +
    `2. Likely interview questions.\n` +
    `3. Smart questions to ask them.\n` +
    `4. Talking points / why this company.\n` +
    `Base it on general knowledge; if unsure about recent facts, say so.`;
  const outcome = await runFeature(userId, "COMPANY", prompt, () =>
    companyBriefFallback(companyName)
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}
```

(`TextOutput` and `runFeature` are already imported in this file.)

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(research): companyBrief AI feature + fallback (TDD)"`

---

### Task 5: Company-brief API route

**Files:** Create `src/app/api/ai/company-brief/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCompany, updateCompany } from "@/services/company-service";
import { companyBrief } from "@/services/ai/features";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const { jobId, refresh } = await req.json();
  const job = await getJob(userId, jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  if (!job.companyId) {
    return NextResponse.json({ error: "add a company to this job first" }, { status: 400 });
  }
  const company = await getCompany(userId, job.companyId);
  if (!company) return NextResponse.json({ error: "company not found" }, { status: 404 });

  if (company.aiBrief && !refresh) {
    return NextResponse.json({
      text: company.aiBrief,
      usedFallback: false,
      cachedAt: company.aiBriefAt,
    });
  }

  const result = await companyBrief(userId, company.name, company.website ?? null, job.title);
  await updateCompany(userId, company.id, {
    // @ts-expect-error aiBrief/aiBriefAt exist on the model post-migration
    aiBrief: result.text,
    aiBriefAt: new Date(),
  });
  return NextResponse.json({ ...result, cachedAt: new Date() });
}
```

NOTE: after Task 2's migration the Prisma types include `aiBrief`/`aiBriefAt`, so remove the
`@ts-expect-error` line if the build complains it is unused. `CompanyInput` should also gain
`aiBrief?: string | null; aiBriefAt?: Date | null;` in `company-service.ts` — add them there and
drop the ts-expect-error.

- [ ] **Step 2: Update `CompanyInput`** in `src/services/company-service.ts`:

```ts
export interface CompanyInput {
  name: string;
  website?: string | null;
  location?: string | null;
  notes?: string | null;
  aiBrief?: string | null;
  aiBriefAt?: Date | null;
}
```

Then remove the `@ts-expect-error` comment line from the route.

- [ ] **Step 3: Build** `npm run build` — `/api/ai/company-brief` listed, no type errors.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(research): company-brief API route (cached on company)"`

---

### Task 6: StageStepper + advance, wired into job page

**Files:** Create `src/components/StageStepper.tsx`; Modify `src/app/jobs/[id]/page.tsx`

- [ ] **Step 1: Write `src/components/StageStepper.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { INTERVIEW_STAGES, STAGE_META, type InterviewStage } from "@/lib/constants";

export default function StageStepper({
  jobId,
  currentStage,
}: {
  jobId: string;
  currentStage: string | null;
}) {
  const router = useRouter();
  const currentIdx = currentStage
    ? INTERVIEW_STAGES.indexOf(currentStage as InterviewStage)
    : -1;
  const nextStage = INTERVIEW_STAGES[currentIdx + 1];

  async function setStage(stage: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStage: stage }),
    });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Interview progress</h2>
        {nextStage && (
          <button
            onClick={() => setStage(nextStage)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Advance to {STAGE_META[nextStage].label}
          </button>
        )}
      </div>
      <ol className="flex flex-wrap items-center gap-2">
        {INTERVIEW_STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={stage} className="flex items-center gap-2">
              <button
                onClick={() => setStage(stage)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "border-indigo-300 bg-indigo-50 font-medium text-indigo-700"
                    : done
                    ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                    : "border-zinc-200 text-zinc-400 hover:bg-zinc-50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[stage].dot}`} />
                {STAGE_META[stage].label}
                {done && <span className="text-emerald-500">✓</span>}
              </button>
              {i < INTERVIEW_STAGES.length - 1 && <span className="text-zinc-300">→</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `src/app/jobs/[id]/page.tsx`.** Add import:

```tsx
import StageStepper from "@/components/StageStepper";
```

Render it right after the detail card `</div>` and before the AI panels grid:

```tsx
      <div className="mt-6">
        <StageStepper jobId={job.id} currentStage={job.currentStage} />
      </div>
```

- [ ] **Step 3: Build** `npm run build` — clean.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(stages): stage stepper with advance on job page"`

---

### Task 7: Group interview timeline by stage

**Files:** Modify `src/components/InterviewSection.tsx`

- [ ] **Step 1: Update the interviews list rendering.** The component receives `interviews: InterviewRow[]`. Add `stage` to `InterviewRow`:

```ts
export interface InterviewRow {
  id: string;
  type: string;
  stage: string | null;
  scheduledAt: string | null;
  outcome: string;
  prepNotes: string | null;
}
```

Replace the existing `{interviews.map((iv) => ( ... ))}` block with a stage-grouped render. Add this import at the top:

```tsx
import { INTERVIEW_STAGES, STAGE_META, type InterviewStage } from "@/lib/constants";
```

And replace the list container body with:

```tsx
        {interviews.length === 0 && (
          <p className="text-sm text-zinc-400">No interviews logged yet.</p>
        )}
        {INTERVIEW_STAGES.filter((st) =>
          interviews.some((iv) => (iv.stage ?? "SCREENING") === st)
        ).map((st) => (
          <div key={st} className="rounded-lg border border-zinc-100 p-2">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-zinc-500">
              <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[st as InterviewStage].dot}`} />
              {STAGE_META[st as InterviewStage].label}
            </div>
            {interviews
              .filter((iv) => (iv.stage ?? "SCREENING") === st)
              .map((iv) => (
                <div key={iv.id} className="flex flex-wrap items-center gap-3 px-1 py-1.5 text-sm">
                  <span className="font-medium text-zinc-700">{iv.type}</span>
                  <span className="text-zinc-500">
                    {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : "unscheduled"}
                  </span>
                  {iv.prepNotes && <span className="text-xs text-zinc-400">— {iv.prepNotes}</span>}
                  <select
                    value={iv.outcome}
                    onChange={(e) => setOutcome(iv.id, e.target.value)}
                    className="ml-auto rounded border border-zinc-200 px-2 py-1 text-xs"
                  >
                    {INTERVIEW_OUTCOMES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <button onClick={() => remove(iv.id)} className="text-xs text-zinc-400 hover:text-rose-500">
                    delete
                  </button>
                </div>
              ))}
          </div>
        ))}
```

(Keep the existing `setOutcome`, `remove`, `addInterview` functions and the add-interview form unchanged. `INTERVIEW_OUTCOMES` is already imported.)

- [ ] **Step 2: Pass `stage` from the job page.** In `src/app/jobs/[id]/page.tsx`, in the `InterviewSection` props mapping, add `stage: iv.stage` to each mapped interview object.

- [ ] **Step 3: Build** `npm run build` — clean.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(stages): group interview timeline by stage"`

---

### Task 8: CompanyResearchPanel

**Files:** Create `src/components/CompanyResearchPanel.tsx`; Modify `src/app/jobs/[id]/page.tsx`

- [ ] **Step 1: Write `src/components/CompanyResearchPanel.tsx`**

```tsx
"use client";

import { useState } from "react";

export default function CompanyResearchPanel({
  jobId,
  hasCompany,
  initialBrief,
}: {
  jobId: string;
  hasCompany: boolean;
  initialBrief: string | null;
}) {
  const [text, setText] = useState<string | null>(initialBrief);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);

  async function run(refresh: boolean) {
    setLoading(true);
    const res = await fetch("/api/ai/company-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, refresh }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setText(data.error ?? "Could not generate brief.");
      return;
    }
    setText(data.text);
    setFallback(Boolean(data.usedFallback));
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Company research</h2>
        {hasCompany && (
          <button
            onClick={() => run(Boolean(text))}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Researching…" : text ? "Refresh" : "Research"}
          </button>
        )}
      </div>
      {!hasCompany && (
        <p className="mt-3 text-sm text-zinc-400">Add a company to this job to research it.</p>
      )}
      {fallback && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No AI key configured — showing a research checklist.
        </p>
      )}
      {text && <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-zinc-700">{text}</pre>}
    </section>
  );
}
```

- [ ] **Step 2: Wire into `src/app/jobs/[id]/page.tsx`.** Add import:

```tsx
import CompanyResearchPanel from "@/components/CompanyResearchPanel";
```

Render after the StageStepper block:

```tsx
      <div className="mt-6">
        <CompanyResearchPanel
          jobId={job.id}
          hasCompany={Boolean(job.companyId)}
          initialBrief={job.company?.aiBrief ?? null}
        />
      </div>
```

(`getJob` includes `company`, which now has `aiBrief` after the migration.)

- [ ] **Step 3: Build** `npm run build` — clean.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(research): company research panel on job page"`

---

### Task 9: Calendar page + nav

**Files:** Create `src/app/calendar/page.tsx`; Modify `src/app/layout.tsx`

- [ ] **Step 1: Write `src/app/calendar/page.tsx`**

```tsx
import Link from "next/link";
import { requireUserId } from "@/lib/auth-helpers";
import {
  listInterviewsInRange,
  listUpcomingInterviews,
} from "@/services/interview-service";

export const dynamic = "force-dynamic";

function monthBounds(monthParam?: string) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { year, month, start, end };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const userId = await requireUserId();
  const { year, month, start, end } = monthBounds(searchParams.month);
  const interviews = await listInterviewsInRange(
    userId,
    start.toISOString(),
    end.toISOString()
  );
  const upcoming = await listUpcomingInterviews(userId, 8);

  // Bucket interviews by day-of-month.
  const byDay: Record<number, typeof interviews> = {};
  for (const iv of interviews) {
    if (!iv.scheduledAt) continue;
    const d = new Date(iv.scheduledAt).getDate();
    (byDay[d] ??= []).push(iv);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Calendar</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/calendar?month=${fmt(prev)}`} className="rounded-md border border-zinc-200 px-2.5 py-1 hover:bg-zinc-50">←</Link>
          <span className="min-w-[140px] text-center font-medium text-zinc-700">{monthLabel}</span>
          <Link href={`/calendar?month=${fmt(next)}`} className="rounded-md border border-zinc-200 px-2.5 py-1 hover:bg-zinc-50">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <div key={i} className="min-h-[72px] rounded-lg border border-zinc-100 p-1 text-xs">
                {d && <div className="mb-1 text-zinc-400">{d}</div>}
                {d && (byDay[d] ?? []).map((iv) => (
                  <Link
                    key={iv.id}
                    href={`/jobs/${iv.job.id}`}
                    className="mb-1 block truncate rounded bg-indigo-50 px-1 py-0.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
                    title={`${iv.job.title} — ${iv.type}`}
                  >
                    {iv.type} · {iv.job.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-zinc-800">Upcoming</h2>
          {upcoming.length === 0 && <p className="text-sm text-zinc-400">No upcoming interviews.</p>}
          <ul className="flex flex-col gap-2">
            {upcoming.map((iv) => (
              <li key={iv.id}>
                <Link href={`/jobs/${iv.job.id}`} className="block rounded-lg border border-zinc-100 px-3 py-2 text-sm hover:bg-zinc-50">
                  <div className="font-medium text-zinc-700">{iv.job.title}</div>
                  <div className="text-xs text-zinc-400">
                    {iv.type} · {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add nav link in `src/app/layout.tsx`** — inside the authed `<nav>`, after the Dashboard link:

```tsx
                  <a href="/calendar" className="hover:text-indigo-600">Calendar</a>
```

- [ ] **Step 3: Build** `npm run build` — `/calendar` listed.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(calendar): in-app interview calendar + upcoming list"`

---

### Task 10: Regression

- [ ] **Step 1: Tests** `npm test` — all prior + new interview/fallback tests pass.
- [ ] **Step 2: Build** `npm run build` — clean.
- [ ] **Step 3: Live smoke** (single wsl call): start dev, log in via the Node helper pattern OR just curl the public bits; verify `/calendar` returns 200 (after auth) and `POST /api/ai/company-brief` returns a fallback brief for a seeded job with a company.
- [ ] **Step 4: Commit** `git add -A && git commit -m "chore: Group A regression pass" --allow-empty`

---

## Self-Review

- **Spec coverage:** stages constant + fields (T1,T2); stepper + advance (T6); grouped timeline (T7);
  company brief feature+fallback+route+panel, cached (T4,T5,T8); calendar + range/upcoming queries (T3,T9);
  notes surfaced inline in timeline (T7). All spec parts mapped.
- **Type consistency:** `INTERVIEW_STAGES`/`STAGE_META`/`stageForType`/`InterviewStage` defined in T1, used in
  T3/T6/T7/T9. `listInterviewsInRange(userId,startISO,endISO)` + `listUpcomingInterviews(userId,limit)` signatures
  match between T3 service and T9 page. `companyBrief(userId,name,website,role)` matches T4 def and T5 route.
  `InterviewRow.stage` added in T7 and populated in T7 step 2.
- **No placeholders:** all steps contain complete code.
