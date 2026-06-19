# CareerFlow OS — Group B: SaaS Home Page — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorming)
**Scope:** Group B of the 3-group batch. Group A (interview workspace) is done; Group C
(n8n / notifications / billing) follows.

## Goal

Give the app a real "front door": an authenticated **dashboard-home** (`/home`) as the
post-login landing, plus a **polished, honest marketing page** at `/`.

## Decisions

- Login + signup redirect to `/home` (was `/board`). Public `/` stays the marketing page.
- Home shows: this-week interviews, action-needed nudges, quick stats + pipeline, quick-add + recent activity.
- Marketing: honest — feature deep-dives + how-it-works + FAQ, CSS mockups (no real screenshots,
  no invented testimonials or user counts).

---

## Part 1 — Authenticated dashboard-home (`/home`)

**New service `src/services/nudge-service.ts`** — `computeNudges(userId)` returns
`Nudge[]` where `Nudge = { kind, message, jobId, jobTitle }`. Rules (all from existing data):
- **FOLLOW_UP** — job with `status` in {APPLIED, INTERVIEW} and `updatedAt` older than 7 days.
- **ADD_PREP** — an interview with `scheduledAt` in the future and empty/blank `prepNotes`.
- **TAG_CV** — job with `status` in {INTERVIEW, OFFER} and `cvId` null.
Cap at ~8 nudges, most recent/relevant first.

**New page `src/app/home/page.tsx`** (server, `requireUserId`), sections:
1. **Greeting + quick-add** — "Welcome back, {name}" + reuse `JobForm` (compact).
2. **This week's interviews** — `listUpcomingInterviews(userId, 5)` filtered to next 7 days; links to `/jobs/{id}`.
3. **Nudges** — render `computeNudges`; each links to its job. Empty state: "You're all caught up."
4. **Quick stats + pipeline** — reuse `computeStats` + `StatCard` + `PipelineBar`.
5. **Recent activity** — jobs by `updatedAt` desc, limit 6 (add `listRecentJobs(userId, limit)` to job-service).

**Redirects:** `src/app/login/actions.ts` `redirectTo: "/home"`. Marketing CTAs for authed
users point to `/home`. Header logo stays `/`.

## Part 2 — Polished marketing page (`/`)

Enhance `src/app/page.tsx` (keep hero/problem/pricing/CTA), add:
- **How it works** — 3 numbered steps.
- **Feature deep-dives** — 3 alternating rows (Board / Interview workspace / AI), each with a
  small CSS mockup component (`src/components/marketing/Mockups.tsx`) in the existing mock-board style.
- **FAQ** — 4–5 Q&A (free? AI key needed? data private? self-host? — answered honestly).

No new data, no auth changes; pure presentational. Reuse existing Tailwind palette.

---

## File map

```
src/services/nudge-service.ts          # NEW — computeNudges(userId)
src/services/job-service.ts            # ADD listRecentJobs(userId, limit)
src/app/home/page.tsx                  # NEW — authed dashboard-home
src/components/HomeNudges.tsx          # NEW — renders nudges (client links ok as server too)
src/components/marketing/Mockups.tsx   # NEW — CSS mockups for marketing
src/app/page.tsx                       # MODIFY — how-it-works + deep-dives + FAQ
src/app/login/actions.ts              # MODIFY — redirectTo /home
tests/nudge-service.test.ts            # NEW — one test per rule
```

## Testing

- **TDD:** `computeNudges` — seed data hitting FOLLOW_UP, ADD_PREP, TAG_CV; assert each appears;
  assert a fresh fully-set job yields none.
- **Build** typechecks `/home` + marketing.
- **Live smoke:** login → `/home` 200 and contains "Welcome"; `/` 200 public with "How it works".

## Out of scope

Real screenshots, testimonials/social proof, onboarding tour, customizable home layout.

## Next

writing-plans → implement → then Group C (n8n / notifications / billing, prepared locally).
