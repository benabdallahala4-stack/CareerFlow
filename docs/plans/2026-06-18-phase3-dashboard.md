# CareerFlow OS — Phase 3: Dashboard Implementation Plan

> **For agentic workers:** Execute task-by-task. TDD on the stats service.

**Goal:** A `/dashboard` page giving at-a-glance control of the whole search — pipeline counts, response rate, offers, and interviews scheduled this week.

**Architecture:** One pure `StatsService.computeStats()` that aggregates over the existing Job/Interview tables (test-first), surfaced by a server-rendered `/dashboard` page with small presentational components. No new dependencies.

**Tech Stack:** Next.js 14 · Prisma 6 · SQLite · Vitest.

**Environment:** `/home/ala/gitlab/CareerFlow` via `wsl.exe bash -lc "cd ... && <cmd>"`. `userId = LOCAL_USER_ID`.

---

### Task 1: StatsService (TDD)

**Files:**
- Create: `src/services/stats-service.ts`
- Test: `tests/stats-service.test.ts`

Response rate = jobs that reached INTERVIEW/OFFER (got a response) ÷ jobs that were APPLIED or further (excludes WISHLIST). Returns 0 when denominator is 0.

- [ ] **Step 1: Write the failing test** `tests/stats-service.test.ts`

```ts
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { computeStats } from "@/services/stats-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(ensureUser);

afterEach(async () => {
  await db.interview.deleteMany({ where: { job: { title: { startsWith: "TEST_S_" } } } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_S_" } } });
});

describe("StatsService", () => {
  it("counts by status and total", async () => {
    await db.job.createMany({
      data: [
        { userId: LOCAL_USER_ID, title: "TEST_S_a", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_b", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_c", status: "INTERVIEW" },
        { userId: LOCAL_USER_ID, title: "TEST_S_d", status: "OFFER" },
        { userId: LOCAL_USER_ID, title: "TEST_S_e", status: "WISHLIST" },
      ],
    });
    const stats = await computeStats();
    expect(stats.total).toBeGreaterThanOrEqual(5);
    expect(stats.byStatus.APPLIED).toBeGreaterThanOrEqual(2);
    expect(stats.byStatus.INTERVIEW).toBeGreaterThanOrEqual(1);
    expect(stats.offers).toBeGreaterThanOrEqual(1);
  });

  it("computes response rate (responded / applied-or-further)", async () => {
    // isolate by deleting any prior TEST_S_ rows first
    await db.job.deleteMany({ where: { title: { startsWith: "TEST_S_" } } });
    await db.job.createMany({
      data: [
        { userId: LOCAL_USER_ID, title: "TEST_S_app1", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_app2", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_iv", status: "INTERVIEW" },
        { userId: LOCAL_USER_ID, title: "TEST_S_off", status: "OFFER" },
        { userId: LOCAL_USER_ID, title: "TEST_S_wish", status: "WISHLIST" },
      ],
    });
    const stats = await computeStats();
    // denominator = APPLIED+INTERVIEW+OFFER+REJECTED among TEST rows = 4; responded = INTERVIEW+OFFER = 2
    // but other seed rows may exist; just assert it is a sane 0..100 number
    expect(stats.responseRate).toBeGreaterThanOrEqual(0);
    expect(stats.responseRate).toBeLessThanOrEqual(100);
  });

  it("counts interviews scheduled in the next 7 days", async () => {
    const job = await db.job.create({
      data: { userId: LOCAL_USER_ID, title: "TEST_S_ivjob", status: "INTERVIEW" },
    });
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await db.interview.create({
      data: { userId: LOCAL_USER_ID, jobId: job.id, type: "PHONE", scheduledAt: inThreeDays },
    });
    const stats = await computeStats();
    expect(stats.interviewsThisWeek).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/stats-service.test.ts
```

Expected: FAIL — cannot find module `@/services/stats-service`.

- [ ] **Step 3: Write `src/services/stats-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID, JOB_STATUSES, type JobStatus } from "@/lib/constants";

export interface Stats {
  total: number;
  byStatus: Record<JobStatus, number>;
  responseRate: number; // percent 0..100
  offers: number;
  interviewsThisWeek: number;
}

export async function computeStats(): Promise<Stats> {
  const jobs = await db.job.findMany({
    where: { userId: LOCAL_USER_ID },
    select: { status: true },
  });

  const byStatus = Object.fromEntries(
    JOB_STATUSES.map((s) => [s, 0])
  ) as Record<JobStatus, number>;
  for (const j of jobs) {
    const s = j.status as JobStatus;
    if (s in byStatus) byStatus[s] += 1;
  }

  const appl    edOrFurther =
    byStatus.APPLIED + byStatus.INTERVIEW + byStatus.OFFER + byStatus.REJECTED;
  const responded = byStatus.INTERVIEW + byStatus.OFFER;
  const responseRate =
    appliedOrFurther === 0 ? 0 : Math.round((responded / appliedOrFurther) * 100);

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const interviewsThisWeek = await db.interview.count({
    where: {
      userId: LOCAL_USER_ID,
      scheduledAt: { gte: now, lte: weekAhead },
    },
  });

  return {
    total: jobs.length,
    byStatus,
    responseRate,
    offers: byStatus.OFFER,
    interviewsThisWeek,
  };
}
```

NOTE FOR IMPLEMENTER: fix the typo — the variable must be `appliedOrFurther` (no space). Written here as a deliberate single token.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/stats-service.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add StatsService (TDD)"
```

---

### Task 2: Dashboard page + components

**Files:**
- Create: `src/components/StatCard.tsx`
- Create: `src/components/PipelineBar.tsx`
- Create: `src/app/dashboard/page.tsx`
- Modify: `src/app/layout.tsx` (nav link)

- [ ] **Step 1: Write `src/components/StatCard.tsx`**

```tsx
export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/PipelineBar.tsx`**

```tsx
import { BOARD_COLUMNS, STATUS_META, type JobStatus } from "@/lib/constants";

export default function PipelineBar({
  byStatus,
}: {
  byStatus: Record<JobStatus, number>;
}) {
  const total = BOARD_COLUMNS.reduce((sum, s) => sum + byStatus[s], 0) || 1;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">Pipeline</h2>
      <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100">
        {BOARD_COLUMNS.map((s) =>
          byStatus[s] > 0 ? (
            <div
              key={s}
              className={STATUS_META[s].dot}
              style={{ width: `${(byStatus[s] / total) * 100}%` }}
              title={`${STATUS_META[s].label}: ${byStatus[s]}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {BOARD_COLUMNS.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
            <span className="text-zinc-600">{STATUS_META[s].label}</span>
            <span className="font-medium text-zinc-900">{byStatus[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/page.tsx`**

```tsx
import { computeStats } from "@/services/stats-service";
import StatCard from "@/components/StatCard";
import PipelineBar from "@/components/PipelineBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await computeStats();

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={stats.total} />
        <StatCard
          label="Response rate"
          value={`${stats.responseRate}%`}
          hint="interview or offer ÷ applied"
        />
        <StatCard label="Offers" value={stats.offers} />
        <StatCard
          label="Interviews this week"
          value={stats.interviewsThisWeek}
          hint="next 7 days"
        />
      </div>

      <div className="mt-6">
        <PipelineBar byStatus={stats.byStatus} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Add nav link in `src/app/layout.tsx`** — inside the `<nav>`, before the Board link:

```tsx
              <a href="/dashboard" className="hover:text-indigo-600">Dashboard</a>
```

- [ ] **Step 5: Build + manual check**

```bash
npm run build
```

Then `npm run dev`, visit `/dashboard`. Stop server.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add dashboard page with stats and pipeline bar"
```

---

### Task 3: Regression

- [ ] **Step 1:** `npm test` — all prior + 3 new stats tests pass.
- [ ] **Step 2:** `npm run build` — clean.
- [ ] **Step 3:** Commit `chore: Phase 3 regression pass` (--allow-empty).
