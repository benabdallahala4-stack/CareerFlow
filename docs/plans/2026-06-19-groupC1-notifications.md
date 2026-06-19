# Group C.1 — Notifications Implementation Plan

**Goal:** In-app notifications (bell + feed), event + time-based + external triggers. Per spec
`docs/specs/2026-06-19-groupC1-notifications-design.md`. TDD on services. No new deps.

**Env:** `wsl.exe bash -lc "cd /home/ala/gitlab/CareerFlow && <cmd>"`; Postgres up.

### Task 1: Schema + secret env
- Add `Notification` model (+ `@@unique([userId, dedupeKey])`) and `User.notifications` relation.
- `npx prisma migrate dev --name notifications`. Append `INTERNAL_API_SECRET="dev-internal-secret"` to `.env`.
- Commit.

### Task 2: NotificationService (TDD)
- create (idempotent on dedupeKey), list, unreadCount, markRead, markAllRead. Test dedupe + unread/read.
- Commit.

### Task 3: notification-generator (TDD)
- `generateDueNotifications(userId, now)` — reminders (rem24/rem1) + nudges (daily dedupe). Tests per spec.
- Commit.

### Task 4: Event triggers in job-service
- `updateJob`/`updateJobStatus`: detect status/currentStage change → createNotification.
- Build + commit.

### Task 5: internal-auth + API routes
- `src/lib/internal-auth.ts`; `/api/notifications` GET, `/api/notifications/read-all` POST,
  `/api/notifications/[id]/read` POST; `/api/internal/run-notifications` POST, `/api/internal/notify` POST.
- Build + commit.

### Task 6: UI
- `NotificationBell` (server) in header; `/notifications` page. Build + commit.

### Task 7: Regression — tests, build, smoke (internal run w/ secret → created; bad secret 401; /notifications 200), reset DB, commit.

Full code applied inline.
