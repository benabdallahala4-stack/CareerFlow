# CareerFlow OS — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the CareerFlow OS foundation (Next.js + Prisma + SQLite) and a working job tracker — companies + jobs CRUD, a drag-and-drop Kanban board, and a job detail view — usable for a real job hunt.

**Architecture:** Single Next.js (App Router) project. Business logic lives in framework-agnostic service modules (`JobService`, `CompanyService`) that the API routes call — this keeps logic testable and lets a future n8n service hit the same REST routes. Prisma over SQLite now; the schema includes `userId` everywhere so multi-user/Postgres is additive later. TDD on the service + API layer; UI built on top.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite · Vitest (unit/integration) · @dnd-kit (Kanban drag).

**Environment note:** The project lives in WSL at `/home/ala/gitlab/CareerFlow`. Run all `npm`/`npx` commands from inside that directory (use a WSL terminal so Node is the Linux toolchain, not git-bash). A single dev user is assumed; `userId` is hardcoded to a seeded `"local-user"` until auth lands in Phase A.

---

## File Structure

```
CareerFlow/
├── prisma/
│   ├── schema.prisma          # full data model (spec §4)
│   └── seed.ts                # local-user + sample data
├── src/
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   └── constants.ts       # LOCAL_USER_ID, status enums helpers
│   ├── services/
│   │   ├── company-service.ts # Company business logic
│   │   └── job-service.ts     # Job business logic (CRUD, status, reorder)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Kanban board (home)
│   │   ├── globals.css
│   │   ├── jobs/[id]/page.tsx # Job detail view
│   │   └── api/
│   │       ├── companies/route.ts
│   │       ├── companies/[id]/route.ts
│   │       ├── jobs/route.ts
│   │       ├── jobs/[id]/route.ts
│   │       └── jobs/[id]/status/route.ts
│   └── components/
│       ├── KanbanBoard.tsx
│       ├── KanbanColumn.tsx
│       ├── JobCard.tsx
│       └── JobForm.tsx
├── tests/
│   ├── company-service.test.ts
│   └── job-service.test.ts
├── vitest.config.ts
└── ...config files
```

---

## PHASE 0 — Foundation

### Task 1: Scaffold the Next.js project

**Files:**
- Create: entire project skeleton via `create-next-app`

- [ ] **Step 1: Scaffold into the existing CareerFlow folder**

Run from inside `/home/ala/gitlab/CareerFlow`:

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

When prompted that the directory is not empty (the `docs/` folder + git exist), choose to continue/keep existing files.

- [ ] **Step 2: Verify the dev server runs**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000`, default Next.js page renders. Stop it with Ctrl-C.

- [ ] **Step 3: Add a `.gitignore` entry for the SQLite db and uploads**

Append to `.gitignore`:

```
# CareerFlow local data
/prisma/*.db
/prisma/*.db-journal
/uploads
.env
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind foundation"
```

---

### Task 2: Install and configure Prisma + SQLite with the full schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env`
- Create: `src/lib/db.ts`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma --save-dev
npm install @prisma/client
```

- [ ] **Step 2: Create `.env`**

```
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 3: Write `prisma/schema.prisma`** (full model from spec §4)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())

  companies  Company[]
  jobs       Job[]
  interviews Interview[]
  cvs        Cv[]
  notes      Note[]
  aiSettings AiSetting[]
  aiUsage    AiUsageLog[]
}

model Company {
  id       String  @id @default(cuid())
  userId   String
  name     String
  website  String?
  location String?
  notes    String?

  user User  @relation(fields: [userId], references: [id])
  jobs Job[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Job {
  id          String   @id @default(cuid())
  userId      String
  companyId   String?
  title       String
  description String?
  url         String?
  salary      String?
  location    String?
  source      String?
  status      String   @default("WISHLIST") // WISHLIST|APPLIED|INTERVIEW|OFFER|REJECTED|ARCHIVED
  boardOrder  Int      @default(0)
  cvId        String?
  matchScore  Int?
  appliedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  company    Company?    @relation(fields: [companyId], references: [id])
  cv         Cv?         @relation(fields: [cvId], references: [id])
  interviews Interview[]
  notes      Note[]
}

model Interview {
  id          String    @id @default(cuid())
  userId      String
  jobId       String
  type        String    // PHONE|TECHNICAL|ONSITE|HR|FINAL
  scheduledAt DateTime?
  durationMin Int?
  location    String?
  notes       String?
  outcome     String    @default("PENDING") // PENDING|PASSED|FAILED|CANCELLED
  prepNotes   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id])
  job  Job  @relation(fields: [jobId], references: [id])
  notes Note[]
}

model Cv {
  id        String   @id @default(cuid())
  userId    String
  label     String
  filePath  String?
  content   String?
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User  @relation(fields: [userId], references: [id])
  jobs Job[]
}

model Note {
  id          String   @id @default(cuid())
  userId      String
  jobId       String?
  interviewId String?
  body        String
  createdAt   DateTime @default(now())

  user      User       @relation(fields: [userId], references: [id])
  job       Job?       @relation(fields: [jobId], references: [id])
  interview Interview? @relation(fields: [interviewId], references: [id])
}

model AiSetting {
  id       String  @id @default(cuid())
  userId   String
  provider String  // CLAUDE|OPENAI|GROQ|GEMINI|OLLAMA
  apiKey   String?
  model    String?
  isActive Boolean @default(true)
  priority Int     @default(0)

  user User @relation(fields: [userId], references: [id])
}

model AiUsageLog {
  id        String   @id @default(cuid())
  userId    String
  provider  String
  feature   String
  tokensIn  Int      @default(0)
  tokensOut Int      @default(0)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 4: Create the first migration**

```bash
npx prisma migrate dev --name init
```

Expected: creates `prisma/migrations/.../migration.sql`, applies it, generates the client. `prisma/dev.db` now exists.

- [ ] **Step 5: Write `src/lib/db.ts`** (singleton — avoids exhausting connections in dev hot-reload)

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 6: Write `src/lib/constants.ts`**

```ts
export const LOCAL_USER_ID = "local-user";

export const JOB_STATUSES = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

// Columns shown on the Kanban board (ARCHIVED hidden by default)
export const BOARD_COLUMNS: JobStatus[] = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema, SQLite, db client, constants"
```

---

### Task 3: Seed script (local user + sample jobs)

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config + script)

- [ ] **Step 1: Install tsx (TypeScript runner for the seed)**

```bash
npm install tsx --save-dev
```

- [ ] **Step 2: Write `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import { LOCAL_USER_ID } from "../src/lib/constants";

const db = new PrismaClient();

async function main() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });

  const count = await db.job.count({ where: { userId: LOCAL_USER_ID } });
  if (count === 0) {
    const acme = await db.company.create({
      data: { userId: LOCAL_USER_ID, name: "Acme Corp", location: "Remote" },
    });
    await db.job.createMany({
      data: [
        { userId: LOCAL_USER_ID, companyId: acme.id, title: "Backend Engineer", status: "APPLIED", boardOrder: 0 },
        { userId: LOCAL_USER_ID, companyId: acme.id, title: "Full-Stack Developer", status: "WISHLIST", boardOrder: 0 },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 3: Add seed config to `package.json`**

Add a top-level `"prisma"` key and a `"seed"` script:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

And in `"scripts"`:

```json
"db:seed": "tsx prisma/seed.ts",
"db:reset": "prisma migrate reset --force"
```

- [ ] **Step 4: Run the seed**

```bash
npx prisma db seed
```

Expected: prints "Seed complete." Verify with:

```bash
npx prisma studio
```

(opens a browser DB viewer; confirm 1 user, 1 company, 2 jobs, then close it)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add seed script with local user and sample jobs"
```

---

### Task 4: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (test script)

- [ ] **Step 1: Install Vitest**

```bash
npm install vitest --save-dev
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 3: Add test script to `package.json` `"scripts"`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test `tests/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

```bash
npm test
```

Expected: 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: set up Vitest with smoke test"
```

---

## PHASE 1 — Job Tracker Core

> Tests in this phase hit a real SQLite database (integration style). The Prisma client reads `DATABASE_URL` from `.env` and operates on `prisma/dev.db`. Each test cleans up the rows it creates so runs stay isolated.

### Task 5: CompanyService (TDD)

**Files:**
- Create: `src/services/company-service.ts`
- Test: `tests/company-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from "@/services/company-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

afterEach(async () => {
  await db.company.deleteMany({ where: { name: { startsWith: "TEST_" } } });
});

describe("CompanyService", () => {
  it("creates and fetches a company", async () => {
    await ensureUser();
    const created = await createCompany({ name: "TEST_Acme", location: "Remote" });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("TEST_Acme");

    const fetched = await getCompany(created.id);
    expect(fetched?.location).toBe("Remote");
  });

  it("lists, updates and deletes", async () => {
    await ensureUser();
    const c = await createCompany({ name: "TEST_Beta" });
    const list = await listCompanies();
    expect(list.some((x) => x.id === c.id)).toBe(true);

    const updated = await updateCompany(c.id, { website: "https://beta.test" });
    expect(updated.website).toBe("https://beta.test");

    await deleteCompany(c.id);
    expect(await getCompany(c.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/company-service.test.ts
```

Expected: FAIL — cannot find module `@/services/company-service`.

- [ ] **Step 3: Write `src/services/company-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";

export interface CompanyInput {
  name: string;
  website?: string | null;
  location?: string | null;
  notes?: string | null;
}

export function listCompanies() {
  return db.company.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { name: "asc" },
  });
}

export function getCompany(id: string) {
  return db.company.findFirst({ where: { id, userId: LOCAL_USER_ID } });
}

export function createCompany(input: CompanyInput) {
  return db.company.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateCompany(id: string, input: Partial<CompanyInput>) {
  return db.company.update({ where: { id }, data: input });
}

export function deleteCompany(id: string) {
  return db.company.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/company-service.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add CompanyService with CRUD (TDD)"
```

---

### Task 6: JobService (TDD)

**Files:**
- Create: `src/services/job-service.ts`
- Test: `tests/job-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  updateJobStatus,
  deleteJob,
} from "@/services/job-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

afterEach(async () => {
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_" } } });
});

describe("JobService", () => {
  it("creates a job with default WISHLIST status", async () => {
    await ensureUser();
    const job = await createJob({ title: "TEST_Backend Engineer" });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("WISHLIST");
  });

  it("lists jobs and fetches one by id", async () => {
    await ensureUser();
    const job = await createJob({ title: "TEST_Lister" });
    const all = await listJobs();
    expect(all.some((j) => j.id === job.id)).toBe(true);
    const one = await getJob(job.id);
    expect(one?.title).toBe("TEST_Lister");
  });

  it("updates fields", async () => {
    await ensureUser();
    const job = await createJob({ title: "TEST_Update" });
    const updated = await updateJob(job.id, { salary: "100k", location: "Berlin" });
    expect(updated.salary).toBe("100k");
    expect(updated.location).toBe("Berlin");
  });

  it("moves status and sets appliedAt when entering APPLIED", async () => {
    await ensureUser();
    const job = await createJob({ title: "TEST_Status" });
    const moved = await updateJobStatus(job.id, "APPLIED", 0);
    expect(moved.status).toBe("APPLIED");
    expect(moved.appliedAt).not.toBeNull();
    expect(moved.boardOrder).toBe(0);
  });

  it("deletes a job", async () => {
    await ensureUser();
    const job = await createJob({ title: "TEST_Delete" });
    await deleteJob(job.id);
    expect(await getJob(job.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/job-service.test.ts
```

Expected: FAIL — cannot find module `@/services/job-service`.

- [ ] **Step 3: Write `src/services/job-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID, type JobStatus } from "@/lib/constants";

export interface JobInput {
  title: string;
  companyId?: string | null;
  description?: string | null;
  url?: string | null;
  salary?: string | null;
  location?: string | null;
  source?: string | null;
  status?: JobStatus;
  cvId?: string | null;
}

export function listJobs() {
  return db.job.findMany({
    where: { userId: LOCAL_USER_ID },
    include: { company: true },
    orderBy: [{ status: "asc" }, { boardOrder: "asc" }],
  });
}

export function getJob(id: string) {
  return db.job.findFirst({
    where: { id, userId: LOCAL_USER_ID },
    include: { company: true, interviews: true, notes: true },
  });
}

export function createJob(input: JobInput) {
  return db.job.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateJob(id: string, input: Partial<JobInput>) {
  return db.job.update({ where: { id }, data: input });
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  boardOrder: number
) {
  const current = await db.job.findUnique({ where: { id } });
  const enteringApplied = status === "APPLIED" && current?.appliedAt == null;

  return db.job.update({
    where: { id },
    data: {
      status,
      boardOrder,
      ...(enteringApplied ? { appliedAt: new Date() } : {}),
    },
  });
}

export function deleteJob(id: string) {
  return db.job.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/job-service.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add JobService with CRUD + status moves (TDD)"
```

---

### Task 7: API routes for companies

**Files:**
- Create: `src/app/api/companies/route.ts`
- Create: `src/app/api/companies/[id]/route.ts`

- [ ] **Step 1: Write `src/app/api/companies/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { listCompanies, createCompany } from "@/services/company-service";

export async function GET() {
  return NextResponse.json(await listCompanies());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const company = await createCompany(body);
  return NextResponse.json(company, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/companies/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCompany,
  updateCompany,
  deleteCompany,
} from "@/services/company-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const company = await getCompany(params.id);
  if (!company) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  return NextResponse.json(await updateCompany(params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteCompany(params.id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Verify manually**

Start `npm run dev`, then in another terminal:

```bash
curl -X POST http://localhost:3000/api/companies -H "Content-Type: application/json" -d '{"name":"Curl Co"}'
curl http://localhost:3000/api/companies
```

Expected: POST returns the created company with an `id`; GET lists it. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add companies API routes"
```

---

### Task 8: API routes for jobs

**Files:**
- Create: `src/app/api/jobs/route.ts`
- Create: `src/app/api/jobs/[id]/route.ts`
- Create: `src/app/api/jobs/[id]/status/route.ts`

- [ ] **Step 1: Write `src/app/api/jobs/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/services/job-service";

export async function GET() {
  return NextResponse.json(await listJobs());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const job = await createJob(body);
  return NextResponse.json(job, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/jobs/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob } from "@/services/job-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await getJob(params.id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  return NextResponse.json(await updateJob(params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteJob(params.id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Write `src/app/api/jobs/[id]/status/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateJobStatus } from "@/services/job-service";
import { JOB_STATUSES, type JobStatus } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const status = body?.status as JobStatus;
  if (!JOB_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const boardOrder = typeof body?.boardOrder === "number" ? body.boardOrder : 0;
  return NextResponse.json(await updateJobStatus(params.id, status, boardOrder));
}
```

- [ ] **Step 4: Verify manually**

```bash
curl -X POST http://localhost:3000/api/jobs -H "Content-Type: application/json" -d '{"title":"Curl Engineer"}'
curl http://localhost:3000/api/jobs
```

Expected: job created with `status: "WISHLIST"`, then listed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add jobs API routes (CRUD + status)"
```

---

### Task 9: JobForm component (create/edit)

**Files:**
- Create: `src/components/JobForm.tsx`

- [ ] **Step 1: Write `src/components/JobForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface JobFormProps {
  initial?: {
    id?: string;
    title?: string;
    url?: string;
    salary?: string;
    location?: string;
    description?: string;
  };
  onDone?: () => void;
}

export default function JobForm({ initial, onDone }: JobFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [salary, setSalary] = useState(initial?.salary ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { title, url, salary, location, description };
    const res = await fetch(
      isEdit ? `/api/jobs/${initial!.id}` : "/api/jobs",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (res.ok) {
      onDone?.();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        className="border rounded px-3 py-2"
        placeholder="Job title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Job posting URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Salary"
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <textarea
        className="border rounded px-3 py-2"
        placeholder="Description / notes"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving || !title}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {saving ? "Saving…" : isEdit ? "Save changes" : "Add job"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add JobForm component for create/edit"
```

---

### Task 10: Kanban board (drag-and-drop)

**Files:**
- Create: `src/components/JobCard.tsx`
- Create: `src/components/KanbanColumn.tsx`
- Create: `src/components/KanbanBoard.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Install dnd-kit**

```bash
npm install @dnd-kit/core
```

- [ ] **Step 2: Write `src/components/JobCard.tsx`**

```tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";

export interface JobCardData {
  id: string;
  title: string;
  company?: { name: string } | null;
  location?: string | null;
}

export default function JobCard({ job }: { job: JobCardData }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded border bg-white p-3 shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div {...listeners} {...attributes} className="flex-1 cursor-grab">
          <div className="font-medium">{job.title}</div>
          <div className="text-sm text-gray-500">
            {job.company?.name ?? "—"}
            {job.location ? ` · ${job.location}` : ""}
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          open
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/KanbanColumn.tsx`**

```tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import JobCard, { JobCardData } from "./JobCard";

export default function KanbanColumn({
  status,
  jobs,
}: {
  status: string;
  jobs: JobCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg p-2 ${
        isOver ? "bg-blue-50" : "bg-gray-100"
      }`}
    >
      <h2 className="px-1 text-sm font-semibold text-gray-700">
        {status} <span className="text-gray-400">({jobs.length})</span>
      </h2>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/KanbanBoard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import KanbanColumn from "./KanbanColumn";
import { JobCardData } from "./JobCard";
import { BOARD_COLUMNS } from "@/lib/constants";

interface BoardJob extends JobCardData {
  status: string;
}

export default function KanbanBoard({ initialJobs }: { initialJobs: BoardJob[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<BoardJob[]>(initialJobs);

  async function handleDragEnd(event: DragEndEvent) {
    const jobId = String(event.active.id);
    const newStatus = event.over ? String(event.over.id) : null;
    if (!newStatus) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    // optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    await fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, boardOrder: 0 }),
    });
    router.refresh();
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobs.filter((j) => j.status === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 5: Write `src/app/page.tsx`** (server component — loads jobs, renders board + add form)

```tsx
import { listJobs } from "@/services/job-service";
import KanbanBoard from "@/components/KanbanBoard";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await listJobs();
  const boardJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company ? { name: j.company.name } : null,
    location: j.location,
    status: j.status,
  }));

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold">CareerFlow OS</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <KanbanBoard initialJobs={boardJobs} />
        </section>
        <aside className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Add a job</h2>
          <JobForm />
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify manually**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: Kanban with columns, seeded jobs in WISHLIST/APPLIED. Add a job via the form → it appears in WISHLIST. Drag a card to another column → it moves and persists (refresh confirms). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add drag-and-drop Kanban board with add-job form"
```

---

### Task 11: Job detail view

**Files:**
- Create: `src/app/jobs/[id]/page.tsx`

- [ ] **Step 1: Write `src/app/jobs/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/services/job-service";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";

export default async function JobDetail({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to board
      </Link>

      <h1 className="mt-3 text-2xl font-bold">{job.title}</h1>
      <p className="text-gray-500">
        {job.company?.name ?? "No company"}
        {job.location ? ` · ${job.location}` : ""}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd>{job.status}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Salary</dt>
          <dd>{job.salary ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Posting</dt>
          <dd>
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {job.url}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Description</dt>
          <dd className="whitespace-pre-wrap">{job.description ?? "—"}</dd>
        </div>
      </dl>

      <section className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Edit job</h2>
        <JobForm
          initial={{
            id: job.id,
            title: job.title,
            url: job.url ?? "",
            salary: job.salary ?? "",
            location: job.location ?? "",
            description: job.description ?? "",
          }}
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify manually**

```bash
npm run dev
```

From the board, click "open" on a card → detail page shows fields + edit form. Change the salary, Save → returns updated. Click "← Back to board". Stop the server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add job detail view with inline edit"
```

---

### Task 12: Full regression pass

- [ ] **Step 1: Run the whole test suite**

```bash
npm test
```

Expected: all tests pass (smoke + company-service + job-service).

- [ ] **Step 2: Type-check the build**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Manual end-to-end smoke**

Start `npm run dev` and confirm in the browser:
1. Board loads with columns and seeded jobs.
2. Add a job → appears in WISHLIST.
3. Drag a job across columns → persists after refresh.
4. Open a job → detail loads.
5. Edit a field → saves.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Phase 0 + Phase 1 regression pass green"
```

---

## Self-Review Notes

- **Spec coverage (§6 Phase 0–1):** scaffold ✓ (Task 1), schema+migration ✓ (Task 2), seed ✓ (Task 3), jobs+companies CRUD ✓ (Tasks 5–8), Kanban with drag ✓ (Task 10), job detail ✓ (Task 11). Notes/CVs/interviews UI are Phase 2 — intentionally not here, though the schema (Task 2) already includes them.
- **Future-proofing (spec §2):** `userId` on every model ✓; services centralize `LOCAL_USER_ID` so swapping in real auth touches only `constants.ts` + services; REST routes are the same surface a future n8n calls ✓; Prisma allows SQLite→Postgres later ✓.
- **Type consistency:** `JobStatus`/`JOB_STATUSES`/`BOARD_COLUMNS` defined once in `constants.ts` and reused; service signatures (`updateJobStatus(id, status, boardOrder)`) match their callers in the status route and KanbanBoard.
- **No placeholders:** every code step contains complete, runnable code.

---

## Next step

After this plan is green, Phase 2 (Interviews + CVs + Notes) and Phase 3 (Dashboard) follow, then Phase 4 (AI layer). Each gets its own plan.
