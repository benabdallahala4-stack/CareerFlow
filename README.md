# CareerFlow OS

An AI-assisted job-search command center — track every application, manage interviews
like a CRM, store CV versions, and use AI (bring your own key) to sharpen your CV and
interview prep. Local-first, free to run, and deployable to a single VPS.

## Features

- **Public landing page** at `/` + email/password accounts (multi-user).
- **Kanban job tracker** — drag applications through Wishlist → Applied → Interview → Offer → Rejected.
- **Interviews, CVs & notes** — log interviews with outcomes, store multiple CV versions, tag a CV to each job.
- **Dashboard** — response rate, offers, interviews this week, pipeline overview.
- **AI layer (optional, BYO key)** — provider-agnostic router (Claude / OpenAI / Groq / Gemini / Ollama)
  powering CV match score, tailoring, interview prep, and a career chat. Falls back to rule-based
  logic when no key is set, so **the app is fully useful without any AI**.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth (credentials) · Vitest.

## Local development

Requires Node 22, Docker, and (on Windows) WSL.

```bash
# 1. Start the local Postgres
docker compose up -d

# 2. Install deps + set up the database
npm install
npx prisma migrate dev
npm run db:seed        # seeds a demo account

# 3. Run the app
npm run dev            # http://localhost:3000
```

Demo login after seeding: **demo@careerflow.local** / **password** — or create your own at `/signup`.

`.env` is required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`.

## Tests

```bash
npm test               # Vitest — service + AI-router unit/integration tests
```

Tests run against the local Postgres and are executed sequentially (`fileParallelism: false`)
because they share one database.

## Deployment

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for a full single-VPS runbook (Docker Compose +
Postgres + Caddy auto-HTTPS). Production migrations apply automatically on container start.

## Project docs

- **Overview — what's built & how to run it:** [`docs/OVERVIEW.md`](docs/OVERVIEW.md)
- Design spec: [`docs/specs/2026-06-18-careerflow-os-design.md`](docs/specs/2026-06-18-careerflow-os-design.md)
- Specs & implementation plans: [`docs/specs/`](docs/specs/), [`docs/plans/`](docs/plans/)
- Deploy runbook: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Roadmap (deferred until there are real users)

n8n email automation (auto-detect interviews/rejections), smart follow-up reminders,
notifications, managed-AI billing. Intentionally not built yet — the free core comes first.
