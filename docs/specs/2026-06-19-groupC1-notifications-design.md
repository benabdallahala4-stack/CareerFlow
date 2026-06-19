# CareerFlow OS — Group C.1: Notifications — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorming)
**Scope:** First of Group C's three subsystems (Notifications → n8n → Billing).

## Goal

An in-app notification system (bell + feed) that is the **sink** for events across the app:
stage/status changes (inline), interview reminders + nudges (time-based, via a secret cron
endpoint), and external events like recruiter replies (via a secret ingest endpoint, for n8n later).
In-app only for now; built with a seam so email/push channels can be added later. Free, deploy-ready.

## Decisions

- Channels: **in-app only** now. `createNotification` persists; channel fan-out is a future seam.
- Triggers: stage/status changes, interview reminders (**24h + 1h** before), the existing nudges,
  recruiter replies (endpoint wired now, n8n activates later).
- Time-based generation: a **secret-protected `POST /api/internal/run-notifications`** endpoint
  (no always-on worker). Called by system cron / n8n on deploy; manually locally.
- Idempotency: every generated notification carries a `dedupeKey` unique per user.

---

## Data model

New `Notification` model:
```
id, userId, kind, title, body, jobId? (nullable), read Boolean @default(false),
dedupeKey String?, createdAt
@@unique([userId, dedupeKey])
```
`kind` values: `STAGE_CHANGE | STATUS_CHANGE | REMINDER | NUDGE | RECRUITER_REPLY | GENERIC`.

## Services

`src/services/notification-service.ts`:
- `createNotification(userId, { kind, title, body, jobId?, dedupeKey? })` — idempotent: if
  `dedupeKey` is set and a row already exists for `(userId, dedupeKey)`, no-op (returns existing).
- `listNotifications(userId, limit)`, `unreadCount(userId)`, `markRead(userId, id)`, `markAllRead(userId)`.

`src/services/notification-generator.ts`:
- `generateDueNotifications(userId, now)` — pure-ish, `now` injected for tests:
  - For each interview with `scheduledAt > now`: if `scheduledAt - now <= 24h` → reminder
    `dedupeKey = rem24-{interviewId}`; if `<= 1h` → reminder `dedupeKey = rem1-{interviewId}`.
  - For each nudge from `computeNudges(userId)`: notification with
    `dedupeKey = nudge-{kind}-{jobId}-{YYYY-MM-DD}` (daily dedupe so it can re-surface next day).
  - Returns the count created.

## Event-driven triggers

In `job-service.ts`: `updateJob` and `updateJobStatus` compare before/after; if `status` or
`currentStage` changed, call `createNotification` with kind `STATUS_CHANGE` / `STAGE_CHANGE`
(e.g. "Backend Engineer → Technical"). No dedupeKey (every change is its own event).

## API routes

- `GET /api/notifications` (session) — list; `POST /api/notifications/read-all` (session) — mark all read;
  `POST /api/notifications/{id}/read` (session) — mark one.
- `POST /api/internal/run-notifications` — header `x-internal-secret: $INTERNAL_API_SECRET`; loops all
  users, calls `generateDueNotifications(userId, new Date())`; returns `{ created }`. 401 on bad secret.
- `POST /api/internal/notify` — same secret; body `{ userId, kind, title, body, jobId?, dedupeKey? }`;
  creates a notification (this is what n8n will call for recruiter replies). 401 on bad secret.

`src/lib/internal-auth.ts`: `assertInternalSecret(req)` helper.

## UI

- `src/components/NotificationBell.tsx` — server component; shows a bell with unread count badge,
  links to `/notifications`. Rendered in the header (authed only).
- `src/app/notifications/page.tsx` — feed: each notification (title, body, time, link to job if any),
  unread highlighted, a "Mark all read" button (calls the read-all route then refreshes).

## Env

`INTERNAL_API_SECRET` added to `.env` (dev value) and documented for prod (`DEPLOY.md` + compose).

## Testing

- **TDD:** `createNotification` dedupe (same key twice → one row); `unreadCount`/`markRead`/`markAllRead`;
  `generateDueNotifications` — interview 30 min out → creates rem24+rem1; 10h out → rem24 only; second
  run → no duplicates; a nudge produces one notification, second run same day → no dup.
- **Build** typechecks routes/pages.
- **Live smoke:** internal run endpoint with the secret returns `{created}`; bad secret → 401;
  `/notifications` page 200 after login; a status change creates a notification.

## Out of scope (later)

Email + web-push channels, notification preferences/mute, n8n itself (next sub-spec), real scheduling
infra (we expose the endpoint; cron wiring is a deploy step).

## Next

writing-plans → implement → then Group C.2 (n8n) → C.3 (billing).
