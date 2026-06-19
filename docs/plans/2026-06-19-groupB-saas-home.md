# Group B — SaaS Home Page Implementation Plan

**Goal:** Authenticated `/home` dashboard (post-login landing) + polished honest marketing `/`.

**Tech:** Next.js 14 · Prisma 6 · Postgres · Vitest. No new deps. TDD on NudgeService.

**Env:** `wsl.exe bash -lc "cd /home/ala/gitlab/CareerFlow && <cmd>"`; Postgres up.

---

### Task 1: NudgeService (TDD) + listRecentJobs

- `src/services/nudge-service.ts` — `computeNudges(userId)` with rules FOLLOW_UP / ADD_PREP / TAG_CV (see spec).
- `src/services/job-service.ts` — add `listRecentJobs(userId, limit)`.
- `tests/nudge-service.test.ts` — one assertion per rule (backdate updatedAt via raw SQL for FOLLOW_UP).
- Commit `feat(home): NudgeService + listRecentJobs (TDD)`.

### Task 2: /home dashboard page + HomeNudges + redirects

- `src/components/HomeNudges.tsx` — renders nudges with links.
- `src/app/home/page.tsx` — greeting + quick-add (JobForm), this-week interviews, nudges, stats+pipeline, recent activity.
- `src/app/login/actions.ts` — `redirectTo: "/home"`.
- Marketing CTAs (`src/app/page.tsx`) for authed users → `/home`.
- Build + commit `feat(home): authenticated dashboard-home + post-login redirect`.

### Task 3: Marketing polish

- `src/components/marketing/Mockups.tsx` — CSS mockups (board, workspace, AI).
- `src/app/page.tsx` — add How-it-works, feature deep-dives, FAQ.
- Build + commit `feat(marketing): how-it-works, feature deep-dives, FAQ`.

### Task 4: Regression

- `npm test`, `npm run build`, live smoke (login → /home 200 'Welcome'; / 200 'How it works'), reset DB, commit.

Full code is applied inline during execution.
