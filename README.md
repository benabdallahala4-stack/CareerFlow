# CareerFlow OS

An AI-assisted job-search command center — track every application, manage interviews
like a CRM, store CV versions, and use AI (bring your own key) to sharpen your CV and
interview prep. Local-first, free to run, and deployable to Vercel or a single VPS.

## 🔗 Live

- **App:** https://careerflow-eta-azure.vercel.app
- **Companion — DevMaster Hub** (interview prep): https://devmaster-hub.vercel.app

CareerFlow tracks your job hunt; its companion **[DevMaster Hub](https://github.com/benabdallahala4-stack/Devmaster-hub)**
prepares you for the interviews it schedules. Each interview has a **"Prep →"** link (and the
dashboard a **"Start learning"** banner) that opens a DevMaster mock interview pre-filtered by
role and seniority.

## Features

- **Public landing page** at `/` + email/password accounts (multi-user).
- **Kanban job tracker** — drag applications through Wishlist → Applied → Interview → Offer → Rejected.
- **Interviews, CVs & notes** — log interviews with outcomes, store multiple CV versions, tag a CV to each job.
- **Dashboard** — response rate, offers, interviews this week, pipeline overview.
- **AI layer (optional, BYO key)** — provider-agnostic router (Claude / OpenAI / Groq / Gemini / Ollama)
  powering CV match score, tailoring, interview prep, and a career chat. Falls back to rule-based
  logic when no key is set, so **the app is fully useful without any AI**.
- **DevMaster Hub integration** — deep-links from interviews and the dashboard into a tailored
  interview-prep session (see [Live](#-live)).

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth (credentials) · Vitest.
Deployed on **Vercel** with **Neon** Postgres (serverless) and **Vercel Blob** for CV files.

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

### Vercel (free tier — current live setup)

Pushing to `main` auto-deploys via the Vercel Git integration. First-time setup:

1. Import the repo on Vercel.
2. **Storage tab** → add **Neon Postgres** (injects `DATABASE_URL` + `DATABASE_URL_UNPOOLED`)
   and **Blob** (injects `BLOB_READ_WRITE_TOKEN`).
3. Add env vars: `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `INTERNAL_API_SECRET`, and
   `NEXT_PUBLIC_DEVMASTER_URL` (the DevMaster Hub URL).
4. Deploy — the build runs `prisma generate && prisma migrate deploy && next build`, so
   migrations apply automatically. Prisma uses the non-pooled `directUrl` for migrations.

See [`.env.example`](.env.example) for the full variable list.

### Self-hosted VPS

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
