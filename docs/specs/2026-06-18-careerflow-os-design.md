# CareerFlow OS — Design Specification

**Date:** 2026-06-18
**Status:** Approved (brainstorming complete) — ready for implementation planning
**Author:** Brainstormed with Claude

---

## 1. Vision

CareerFlow OS is a personal-first job-search command center that replaces spreadsheets and
Notion trackers. It manages the full job-search lifecycle — discovery → application →
interview → offer — with an optional AI layer that improves CVs and interview prep.

**Strategy:** Build the free core, use it for a real job hunt, prove it works, then layer
premium SaaS features only once there is traction. **No money spent until the product is a
proven success.**

### Guiding principles
- **Free-first.** The entire core works at $0 — local-first, free-tier deployable.
- **Local-first, then SaaS.** Build and run on the local machine now; the same codebase
  deploys to free tiers / a cheap VPS later with no rewrite.
- **AI-enhanced, never AI-dependent.** Every feature works without AI (rule-based fallback).
- **Lean now, A is the destination.** Build the minimal slice (Approach B) but architect so
  the full SaaS (Approach A — auth, Postgres, n8n, billing) is a series of additions, never a
  rewrite.

---

## 2. Chosen Approach

**Approach B — Lean Local-First, Grows Into SaaS** (selected over the as-written full-SaaS
prompt, and over a no-code dead-end).

Rejected from the original ChatGPT prompt *for the MVP* (deferred, not discarded):
n8n automation, PostgreSQL, multi-user auth, billing, notifications, mobile app. These are
premature before the core is proven and would force paid hosting immediately.

**Future-proofing baked in now (so Approach A is additive):**
- Next.js full-stack — already the deploy target for A.
- Prisma ORM — SQLite → Postgres is a config change, not a rewrite.
- AI provider-router from day one — new providers = new adapter file.
- `userId` on every table now — auth/multi-user later doesn't touch the schema.
- Clean REST API routes — a future **n8n** service calls them via webhooks; nothing blocks it.

---

## 3. Architecture & Stack

**Stack:** Next.js (App Router) + TypeScript + Tailwind + Prisma + SQLite. All free, local,
free-tier deployable unchanged.

```
CareerFlow OS (single Next.js project)
│
├── Frontend (React, Notion/Linear-style UI)
│     Kanban · Job detail · Interview log · CV manager · Dashboard · AI panels
│
├── API Layer (Next.js API routes = future public REST API)
│     /api/jobs · /api/interviews · /api/cvs · /api/ai/*
│
├── Services (business logic separate from routes)
│     JobService · CVService · AIRouter
│
├── AI Router (provider-agnostic)
│     ├─ Claude API adapter      (BYO key)
│     ├─ OpenAI API adapter       (BYO key)
│     ├─ Groq adapter             (BYO key — free tier)
│     ├─ Gemini adapter           (BYO key — free tier)
│     ├─ Ollama adapter           (local, free)
│     └─ Rule-based fallback      (works with NO ai)
│
└── Database (Prisma → SQLite now, Postgres for Phase A)

Planned Phase A backend:
CareerFlow ──REST/webhooks──► n8n (separate service)
                                  └─ Gmail · calendar · email parsing → POST /api/...
```

**AI connection model:** providers connect via the user's own **API keys** (BYOAI). Connecting
a chat *subscription* (ChatGPT Plus / Claude.ai Pro / Claude Code) is explicitly out of scope —
not officially possible without fragile, ToS-violating browser hacks. Free quality path =
Groq/Gemini free keys; premium quality path = Claude/OpenAI keys (pay-per-use, user-controlled).

---

## 4. Data Model

Every table has `userId` (future multi-user) and timestamps.

- **User** — id, email, name, createdAt
- **Company** — id, userId, name, website, location, notes
- **Job** (one application — the Kanban heart) — id, userId, companyId, title, description,
  url, salary, location, source, status (WISHLIST | APPLIED | INTERVIEW | OFFER | REJECTED |
  ARCHIVED), boardOrder, cvId, matchScore (cached, nullable), appliedAt, createdAt, updatedAt
- **Interview** — id, userId, jobId, type (PHONE | TECHNICAL | ONSITE | HR | FINAL),
  scheduledAt, durationMin, location/link, notes, outcome (PENDING | PASSED | FAILED |
  CANCELLED), prepNotes
- **CV** — id, userId, label, filePath, content (extracted text), isDefault
- **Note** — id, userId, jobId?, interviewId?, body, createdAt
- **AiSetting** — id, userId, provider (CLAUDE | OPENAI | GROQ | GEMINI | OLLAMA),
  apiKey (encrypted), model, isActive, priority
- **AiUsageLog** — id, userId, provider, feature, tokensIn, tokensOut, createdAt

**Key decisions:** `Job.cvId` + `Job.matchScore` enable CV-performance analytics and cache AI
results (no double-pay). `CV.content` (text) feeds AI. `AiSetting.priority` implements router
ordering as data. `AiUsageLog` is the foundation for future premium credits/billing.

---

## 5. AI Router + Features

**Golden rule:** AI is optional; the app never breaks without it.

```
Feature → aiRouter.run(feature, context)
  1. Load user's AiSettings by priority
  2. Try providers in order until one succeeds (Claude→OpenAI→Groq→Gemini→Ollama)
  3. If all fail OR none configured → RULE-BASED FALLBACK (always works)
  4. Log to AiUsageLog
```

Uniform adapter interface (adding a provider = one new file):
```ts
interface AiAdapter {
  run(prompt: string, opts): Promise<{ text, tokensIn, tokensOut }>
}
```

| Feature | Context | AI output | Rule-based fallback (no key) |
|---|---|---|---|
| **Match Score** | CV + job description | 0–100 score + missing keywords | Keyword overlap % + missing terms |
| **CV Tailoring** | CV + job description | Rewritten bullet suggestions | "Add key" + manual keyword checklist |
| **Interview Prep** | CV + job + interview type | Likely questions + tips | Generic question bank by role/type |
| **Career Chat** | CV + all jobs + history | Conversational answers | "Add key" gentle prompt |

Match Score & Interview Prep stay genuinely useful with **zero AI**. Tailoring & Chat degrade
gracefully with a soft "add a free Groq key to unlock" nudge (doubles as future conversion).
Results cached; provider failure silently falls through to the next provider, then fallback.

---

## 6. Build Sequence (MVP Roadmap)

Thin usable slices — after every phase the app is usable for a real job hunt.

- **Phase 0 — Foundation (day 1):** scaffold Next.js + TS + Tailwind + Prisma + SQLite; schema;
  first migration; seed. *Result: app runs, DB works.*
- **Phase 1 — Job Tracker (core):** add/edit/delete jobs + companies; Kanban with drag;
  job detail. *Result: ⭐ track real applications; better than a spreadsheet.*
- **Phase 2 — Interviews + CVs + Notes:** log interviews; upload CVs + extract text + tag
  CV→job; free-form notes. *Result: full manual command center.*
- **Phase 3 — Dashboard:** pipeline overview, counts, response rate, interviews-this-week.
- **Phase 4 — AI Layer ⭐:** build Router + adapters + fallback; Match Score end-to-end first,
  then Tailoring → Prep → Chat; settings page for API keys. *Result: the wow, still $0.*

**Deferred to Phase A (SaaS — only once proven):** auth/multi-user, SQLite→Postgres, **n8n**
(Gmail parsing, auto-status), notifications, advanced analytics, billing/credits, deployment.

**Discipline:** do not start Phase A until Phases 1–4 have been used daily and clearly work.

---

## 7. Monetization (future, marked now)

- 🟢 **Free:** job tracking, Kanban, notes, manual interviews, CV storage, basic dashboard,
  AI features via the user's own free keys (Groq/Gemini) or rule-based fallback.
- 🔵 **Premium (Phase A+):** managed AI credits (no key needed), n8n email automation, advanced
  analytics, notifications, multi-user/team. `AiUsageLog` is the metering foundation.

---

## 8. Security & Scaling (notes for later phases)

- API keys encrypted at rest (`AiSetting.apiKey`).
- Secrets in environment variables, never committed.
- AI results cached to bound cost.
- SQLite → Postgres via Prisma when multi-user arrives; Next.js scales horizontally on the
  free-tier/VPS target; n8n runs as an isolated service.

---

## Next step

Proceed to a detailed implementation plan for **Phase 0 + Phase 1** (foundation + job tracker).
