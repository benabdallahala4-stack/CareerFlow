# CareerFlow OS — Group C.2: n8n Automation — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorming)
**Scope:** Second of Group C (Notifications ✅ → n8n → Billing).

## Goal

Email-driven automation: detect interview/rejection/offer emails, match them to a job, and
**propose** a status change the user confirms. The app holds the logic (testable); n8n provides
the Gmail trigger + scheduling. Self-hosted n8n = free. Built wire-ready; Gmail connected at deploy.

## Decisions

- **Propose-then-confirm** — no email auto-changes data; the app creates an `EmailSuggestion` +
  notification, the user clicks Apply/Dismiss.
- **Keyword rules, AI optional** — `classifyEmail` is rule-based; if an AI key exists, AI refines it.
- **Wire-ready** — app endpoints + n8n container (separate `docker-compose.n8n.yml`) + example
  workflow JSON; real Gmail connected at deploy. Locally simulate via curl.
- **Smart follow-ups** reuse C.1's `POST /api/internal/run-notifications` on an n8n schedule (no new code).

---

## Services (TDD)

`src/services/email/classify.ts`:
- `classifyEmail(subject, body): "INTERVIEW"|"REJECTION"|"OFFER"|"OTHER"` — pure, keyword-based.
  Precedence: REJECTION → OFFER → INTERVIEW → OTHER (rejections/offers are more definitive).
- `proposedStatusFor(classification): JobStatus | null` — INTERVIEW→INTERVIEW, REJECTION→REJECTED,
  OFFER→OFFER, OTHER→null.

`src/services/email/match.ts`:
- `matchJobForEmail(userId, from, subject, body): Promise<string | null>` — domain of `from`
  matched against company `website`, else company `name` appearing in subject+body. Returns jobId.

`src/services/email/process.ts`:
- `processIncomingEmail(userId, { from, subject, body })` — classify (rules; AI-refine if key),
  match; if classification ≠ OTHER and a job matched, create an `EmailSuggestion` (PENDING) +
  a `RECRUITER_REPLY`/`GENERIC` notification linking to the job. Returns
  `{ classification, jobId, suggestionId }`. Idempotent-ish: dedupe suggestion by
  `(userId, jobId, classification, subject)` — skip if an identical PENDING one exists.

`src/services/suggestion-service.ts`:
- `listPendingSuggestions(userId)`, `applySuggestion(userId, id)` (sets job status via
  `updateJobStatus` → fires STATUS_CHANGE notif; marks suggestion APPLIED),
  `dismissSuggestion(userId, id)`.

AI-refine (optional): `classifyEmailAI(userId, subject, body)` uses `runFeature(userId,"EMAIL",…)`
with `classifyEmail` result as the fallback; returns one of the four labels.

## Data model

`EmailSuggestion`: `id, userId, jobId, classification, proposedStatus, fromEmail, subject,
snippet, status String @default("PENDING"), createdAt`. Index `(userId, status)`.
Add `User.emailSuggestions` relation.

## API routes

- `POST /api/internal/process-email` — secret-guarded; body `{ userId, from, subject, body }`;
  calls `processIncomingEmail`; returns the result. 401 on bad secret, 400 if fields missing.
- `GET /api/suggestions` (session) — pending suggestions.
- `POST /api/suggestions/[id]/apply` (session), `POST /api/suggestions/[id]/dismiss` (session).

## UI

- `src/components/HomeSuggestions.tsx` (client) — pending suggestions with Apply/Dismiss, rendered
  near the top of `/home` (above nudges) when any exist.
- Notifications from suggestions link to `/home` (or the job).

## n8n (wire-ready)

- `docker-compose.n8n.yml` — n8n service (image `n8nio/n8n`), persistent volume, port 5678,
  env for basic auth; shares the app's network when run together.
- `n8n/workflows/gmail-email-monitor.json` — Gmail trigger → HTTP POST `/api/internal/process-email`
  (secret header from env). Importable.
- `n8n/workflows/follow-ups-schedule.json` — Schedule trigger → HTTP POST
  `/api/internal/run-notifications`.
- `n8n/README.md` + a `DEPLOY.md` section: start n8n, set `INTERNAL_API_SECRET` + app base URL,
  connect Gmail (free Google OAuth), import workflows.

## Testing

- **TDD:** `classifyEmail` (one case per label + precedence), `matchJobForEmail` (domain match,
  name match, no match), `processIncomingEmail` → creates PENDING suggestion for an interview email,
  `applySuggestion` → job becomes INTERVIEW + suggestion APPLIED, `dismissSuggestion` → DISMISSED.
- **Build** typechecks routes/UI.
- **Live smoke (no Gmail):** curl `process-email` with a fake interview email → 200 + suggestionId;
  login → `/home` shows the suggestion; apply via API → job status INTERVIEW.

## Env

`N8N_BASIC_AUTH_USER/PASSWORD` (for the n8n UI) documented; app reuses `INTERNAL_API_SECRET`.

## Out of scope

Real Gmail OAuth setup now (deploy step), multi-account email, calendar event creation from email,
auto-apply (we only propose). Billing is C.3.

## Next

writing-plans → implement → then Group C.3 (billing).
