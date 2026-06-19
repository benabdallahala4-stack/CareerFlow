# CareerFlow OS — Group A: Interview Workspace — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorming) — pending user review of this doc
**Scope:** Group A of a 3-group feature batch. Groups B (SaaS home page) and C (n8n /
notifications / billing infra) are separate specs, built after this.

---

## Goal

Turn the job-detail page into a true **interview workspace**: track multi-step interview
progress per company, research the company with AI, see all interviews on a calendar, and
keep notes in context. All free, builds on existing models, AI-optional with graceful fallback.

## Context

Existing: Next.js 14 (App Router) + Postgres + Prisma + NextAuth (multi-user, every service
takes `userId`) + provider-agnostic AI router (`runFeature(userId, feature, prompt, fallback)`)
with rule-based fallback. Jobs already have many Interviews (type/scheduledAt/outcome/notes/
prepNotes) and Notes. `Company` is shared across a user's jobs.

---

## Part 1 — Data model (additive, one migration)

- `Job.currentStage String?` — current position in the interview process.
- `Interview.stage String?` — which stage a logged interview belongs to (defaults from its `type` on create).
- `Company.aiBrief String?` and `Company.aiBriefAt DateTime?` — cached AI research text + timestamp.
- New constant `INTERVIEW_STAGES` (ordered) with display metadata (label + color), in `src/lib/constants.ts`:
  `APPLIED → SCREENING → TECHNICAL → ONSITE → FINAL → OFFER`.
  This is distinct from `Job.status` (Kanban column). Status = board lane; stage = granular
  progress within interviewing.

Default stage mapping from interview `type` on create: PHONE→SCREENING, TECHNICAL→TECHNICAL,
ONSITE→ONSITE, HR→SCREENING, FINAL→FINAL. (Overridable later; not editable in UI for v1.)

## Part 2 — Interview workspace UI (hybrid stepper + timeline)

On `src/app/jobs/[id]/page.tsx`:
- **Stage stepper** (new `StageStepper` component, client): renders all `INTERVIEW_STAGES`
  horizontally; completed stages (index < currentStage) show a check, current is highlighted,
  future are muted. An **"Advance"** control sets `Job.currentStage` to the next stage via
  `PATCH /api/jobs/{id}` (reuses existing `updateJob`, which already accepts arbitrary job fields
  — add `currentStage` to `JobInput`).
- **Interview timeline**: the existing `InterviewSection` is reordered to group logged interviews
  under their `stage` in stage order, each row showing date, outcome, and notes/prepNotes inline.
  No new endpoint — uses data already loaded by `getJob`.

## Part 3 — Company research (AI, cached)

- New AI feature `companyBrief(userId, { companyName, website, role })` in `src/services/ai/features.ts`:
  one prompt producing a structured brief with four labeled sections — **Overview** (what they do),
  **Likely interview questions**, **Smart questions to ask them**, **Talking points / why this company**.
  Uses `runFeature(userId, "COMPANY", prompt, fallback)`. Add `"COMPANY"` to `AI_FEATURES`.
- **Fallback** (no AI key): a static research checklist covering the same four areas + where to look
  (company site, recent news, Glassdoor, LinkedIn).
- **Route** `POST /api/ai/company-brief` `{ jobId }`: resolve the job (scoped to `userId`) → its
  company → generate the brief → cache on `Company.aiBrief`/`aiBriefAt` → return
  `{ text, usedFallback, cachedAt }`. If the company already has a cached brief, return it unless
  `{ refresh: true }` is sent.
- **UI** `CompanyResearchPanel` (client) on the job page: shows cached brief if present, a
  **Research / Refresh** button, and a fallback notice when no key is configured. Jobs with no
  company show a hint to add one.

## Part 4 — Calendar

- `InterviewService` gains two read functions (scoped to `userId`):
  `listInterviewsInRange(userId, startISO, endISO)` and `listUpcomingInterviews(userId, limit)`,
  both including the parent job's id + title.
- **Page** `src/app/calendar/page.tsx` (server): a month grid for the current month (with
  prev/next via `?month=YYYY-MM`) plus an **Upcoming** list. Each entry shows job title + interview
  type + time and links to `/jobs/{id}`. Custom grid, no calendar library (zero deps).
- Nav: add **Calendar** link in `layout.tsx`.

## Part 5 — Notes

No new subsystem. Per-job notes (Phase 2) and per-interview `notes`/`prepNotes` already exist and
are surfaced inline in the timeline (Part 2). A standalone "all notes" page is explicitly out of
scope for v1 (YAGNI); revisit if needed.

---

## Component / file map

```
src/lib/constants.ts                      # ADD INTERVIEW_STAGES + STAGE_META; map helper
prisma/schema.prisma                      # ADD Job.currentStage, Interview.stage, Company.aiBrief(+At)
src/services/job-service.ts               # JobInput gains currentStage
src/services/interview-service.ts         # ADD listInterviewsInRange, listUpcomingInterviews; set stage on create
src/services/ai/features.ts               # ADD companyBrief()
src/services/ai/fallback.ts               # ADD companyBriefFallback()
src/app/api/ai/company-brief/route.ts     # NEW
src/components/StageStepper.tsx           # NEW (client)
src/components/CompanyResearchPanel.tsx   # NEW (client)
src/components/InterviewSection.tsx       # MODIFY: group by stage, show notes inline
src/app/jobs/[id]/page.tsx                # MODIFY: stepper + research panel
src/app/calendar/page.tsx                 # NEW (server)
src/app/layout.tsx                        # MODIFY: Calendar nav link
tests/interview-service.test.ts           # ADD range/upcoming + default-stage tests
tests/ai-fallback.test.ts                 # ADD companyBriefFallback test
```

## Testing

- **Unit/TDD:** `listInterviewsInRange` / `listUpcomingInterviews` (seeded interviews in/out of
  window), default-stage-from-type on create, `companyBriefFallback` returns the four sections.
- **Build** typechecks all new routes/pages/components.
- **Live smoke:** research endpoint returns a brief (fallback path, no key needed); calendar page
  200; advancing a stage persists.

## Out of scope (deferred)

Google Calendar two-way sync (infra/Group C), `.ics` export, editable stage mapping, standalone
notes page, company research via paid data APIs or live web search (AI-from-knowledge only for v1).

## Next

After approval → writing-plans for Group A. Then Group B (SaaS home page), then Group C infra.
