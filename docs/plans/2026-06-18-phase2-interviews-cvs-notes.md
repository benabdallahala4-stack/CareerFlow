# CareerFlow OS — Phase 2: Interviews + CVs + Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the job tracker into a full manual command center — log interviews per job, store/tag multiple CV versions, and attach free-form notes.

**Architecture:** Extends the existing service + REST + Next.js App Router pattern from Phase 1. Three new service modules (`InterviewService`, `CvService`, `NoteService`), each test-first against the real SQLite DB, exposed via REST routes, and surfaced as sections on the job detail page plus a dedicated `/cvs` manager. CV upload stores the file under `/uploads` (gitignored) and auto-extracts text only for plain-text files; PDF/DOCX text is pasted manually (auto-extraction deferred to Phase 4, where `CV.content` feeds the AI).

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Prisma 6 · SQLite · Vitest. No new dependencies.

**Environment:** Project at `/home/ala/gitlab/CareerFlow` (WSL). Run all npm/npx via `wsl.exe bash -lc "cd /home/ala/gitlab/CareerFlow && <cmd>"`. `userId` is always `LOCAL_USER_ID` (from `@/lib/constants`). Commit with `git -c user.name='Alabab95' -c user.email='benabdallahala4@gmail.com' commit`.

**Schema note:** The `Interview` model's relation to `Note` is named `interviewNotes` (not `notes`, which is a scalar field). `Note` has nullable `jobId` and `interviewId`. `Job.cvId` already exists and `JobService.updateJob` already accepts `cvId`, so tagging a CV to a job reuses the existing jobs PATCH route.

---

## File Structure

```
src/
├── lib/
│   └── constants.ts            # ADD: INTERVIEW_TYPES, INTERVIEW_OUTCOMES
├── services/
│   ├── interview-service.ts    # NEW: interviews CRUD per job
│   ├── note-service.ts         # NEW: notes CRUD per job
│   └── cv-service.ts           # NEW: CV versions CRUD + setDefault + save file
├── app/
│   ├── api/
│   │   ├── jobs/[id]/interviews/route.ts   # NEW: GET list, POST create
│   │   ├── interviews/[id]/route.ts        # NEW: PATCH, DELETE
│   │   ├── jobs/[id]/notes/route.ts        # NEW: GET list, POST create
│   │   ├── notes/[id]/route.ts             # NEW: DELETE
│   │   ├── cvs/route.ts                    # NEW: GET list, POST (multipart upload)
│   │   └── cvs/[id]/route.ts               # NEW: PATCH (default/content), DELETE
│   ├── jobs/[id]/page.tsx      # MODIFY: render Interviews + Notes + CV picker
│   └── cvs/page.tsx            # NEW: CV manager page
├── components/
│   ├── InterviewSection.tsx    # NEW: list + add-interview form + outcome update
│   ├── NoteSection.tsx         # NEW: list + add-note form
│   ├── CvPicker.tsx            # NEW: select which CV is tagged to a job
│   └── CvManager.tsx           # NEW: upload + list + set-default (used by /cvs)
tests/
├── interview-service.test.ts   # NEW
├── note-service.test.ts        # NEW
└── cv-service.test.ts          # NEW
```

---

### Task 1: Add interview enums to constants

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Append the enums to `src/lib/constants.ts`** (after the existing `STATUS_META` block)

```ts
export const INTERVIEW_TYPES = [
  "PHONE",
  "TECHNICAL",
  "ONSITE",
  "HR",
  "FINAL",
] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_OUTCOMES = [
  "PENDING",
  "PASSED",
  "FAILED",
  "CANCELLED",
] as const;

export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add interview type/outcome enums"
```

---

### Task 2: InterviewService (TDD)

**Files:**
- Create: `src/services/interview-service.ts`
- Test: `tests/interview-service.test.ts`

- [ ] **Step 1: Write the failing test** `tests/interview-service.test.ts`

```ts
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createInterview,
  listInterviewsForJob,
  updateInterview,
  deleteInterview,
} from "@/services/interview-service";

let jobId: string;

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  const job = await db.job.create({
    data: { userId: LOCAL_USER_ID, title: "TEST_IV_Job" },
  });
  jobId = job.id;
});

afterEach(async () => {
  await db.interview.deleteMany({ where: { job: { title: "TEST_IV_Job" } } });
  await db.job.deleteMany({ where: { title: "TEST_IV_Job" } });
});

describe("InterviewService", () => {
  it("creates an interview with default PENDING outcome", async () => {
    const iv = await createInterview(jobId, { type: "TECHNICAL" });
    expect(iv.id).toBeTruthy();
    expect(iv.outcome).toBe("PENDING");
    expect(iv.jobId).toBe(jobId);
  });

  it("lists interviews for a job", async () => {
    await createInterview(jobId, { type: "PHONE" });
    await createInterview(jobId, { type: "HR" });
    const list = await listInterviewsForJob(jobId);
    expect(list.length).toBe(2);
  });

  it("updates outcome and prep notes", async () => {
    const iv = await createInterview(jobId, { type: "ONSITE" });
    const updated = await updateInterview(iv.id, {
      outcome: "PASSED",
      prepNotes: "Reviewed system design",
    });
    expect(updated.outcome).toBe("PASSED");
    expect(updated.prepNotes).toBe("Reviewed system design");
  });

  it("deletes an interview", async () => {
    const iv = await createInterview(jobId, { type: "FINAL" });
    await deleteInterview(iv.id);
    const list = await listInterviewsForJob(jobId);
    expect(list.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/interview-service.test.ts
```

Expected: FAIL — cannot find module `@/services/interview-service`.

- [ ] **Step 3: Write `src/services/interview-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID, type InterviewType, type InterviewOutcome } from "@/lib/constants";

export interface InterviewInput {
  type: InterviewType;
  scheduledAt?: string | Date | null;
  durationMin?: number | null;
  location?: string | null;
  notes?: string | null;
  outcome?: InterviewOutcome;
  prepNotes?: string | null;
}

export function listInterviewsForJob(jobId: string) {
  return db.interview.findMany({
    where: { jobId, userId: LOCAL_USER_ID },
    orderBy: { scheduledAt: "asc" },
  });
}

export function createInterview(jobId: string, input: InterviewInput) {
  return db.interview.create({
    data: {
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      jobId,
      userId: LOCAL_USER_ID,
    },
  });
}

export function updateInterview(id: string, input: Partial<InterviewInput>) {
  const { scheduledAt, ...rest } = input;
  return db.interview.update({
    where: { id },
    data: {
      ...rest,
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
    },
  });
}

export function deleteInterview(id: string) {
  return db.interview.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/interview-service.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add InterviewService (TDD)"
```

---

### Task 3: NoteService (TDD)

**Files:**
- Create: `src/services/note-service.ts`
- Test: `tests/note-service.test.ts`

- [ ] **Step 1: Write the failing test** `tests/note-service.test.ts`

```ts
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createNoteForJob,
  listNotesForJob,
  deleteNote,
} from "@/services/note-service";

let jobId: string;

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  const job = await db.job.create({
    data: { userId: LOCAL_USER_ID, title: "TEST_NOTE_Job" },
  });
  jobId = job.id;
});

afterEach(async () => {
  await db.note.deleteMany({ where: { job: { title: "TEST_NOTE_Job" } } });
  await db.job.deleteMany({ where: { title: "TEST_NOTE_Job" } });
});

describe("NoteService", () => {
  it("creates and lists notes for a job (newest first)", async () => {
    await createNoteForJob(jobId, "First note");
    await createNoteForJob(jobId, "Second note");
    const list = await listNotesForJob(jobId);
    expect(list.length).toBe(2);
    expect(list[0].body).toBe("Second note");
  });

  it("deletes a note", async () => {
    const n = await createNoteForJob(jobId, "Delete me");
    await deleteNote(n.id);
    const list = await listNotesForJob(jobId);
    expect(list.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/note-service.test.ts
```

Expected: FAIL — cannot find module `@/services/note-service`.

- [ ] **Step 3: Write `src/services/note-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";

export function listNotesForJob(jobId: string) {
  return db.note.findMany({
    where: { jobId, userId: LOCAL_USER_ID },
    orderBy: { createdAt: "desc" },
  });
}

export function createNoteForJob(jobId: string, body: string) {
  return db.note.create({
    data: { jobId, body, userId: LOCAL_USER_ID },
  });
}

export function deleteNote(id: string) {
  return db.note.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/note-service.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add NoteService (TDD)"
```

---

### Task 4: CvService (TDD)

**Files:**
- Create: `src/services/cv-service.ts`
- Test: `tests/cv-service.test.ts`

- [ ] **Step 1: Write the failing test** `tests/cv-service.test.ts`

```ts
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createCv,
  listCvs,
  getCv,
  setDefaultCv,
  updateCv,
  deleteCv,
} from "@/services/cv-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(ensureUser);

afterEach(async () => {
  await db.cv.deleteMany({ where: { label: { startsWith: "TEST_" } } });
});

describe("CvService", () => {
  it("creates and fetches a CV", async () => {
    const cv = await createCv({ label: "TEST_Backend v1", content: "resume text" });
    expect(cv.id).toBeTruthy();
    const fetched = await getCv(cv.id);
    expect(fetched?.content).toBe("resume text");
  });

  it("lists CVs", async () => {
    await createCv({ label: "TEST_A" });
    await createCv({ label: "TEST_B" });
    const list = await listCvs();
    expect(list.filter((c) => c.label.startsWith("TEST_")).length).toBe(2);
  });

  it("setDefaultCv makes exactly one default", async () => {
    const a = await createCv({ label: "TEST_Def_A", isDefault: true });
    const b = await createCv({ label: "TEST_Def_B" });
    await setDefaultCv(b.id);
    expect((await getCv(a.id))?.isDefault).toBe(false);
    expect((await getCv(b.id))?.isDefault).toBe(true);
  });

  it("updates content and deletes", async () => {
    const cv = await createCv({ label: "TEST_Upd" });
    const updated = await updateCv(cv.id, { content: "new text" });
    expect(updated.content).toBe("new text");
    await deleteCv(cv.id);
    expect(await getCv(cv.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/cv-service.test.ts
```

Expected: FAIL — cannot find module `@/services/cv-service`.

- [ ] **Step 3: Write `src/services/cv-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";

export interface CvInput {
  label: string;
  content?: string | null;
  filePath?: string | null;
  isDefault?: boolean;
}

export function listCvs() {
  return db.cv.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export function getCv(id: string) {
  return db.cv.findFirst({ where: { id, userId: LOCAL_USER_ID } });
}

export function createCv(input: CvInput) {
  return db.cv.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateCv(id: string, input: Partial<CvInput>) {
  return db.cv.update({ where: { id }, data: input });
}

export async function setDefaultCv(id: string) {
  await db.cv.updateMany({
    where: { userId: LOCAL_USER_ID },
    data: { isDefault: false },
  });
  return db.cv.update({ where: { id }, data: { isDefault: true } });
}

export function deleteCv(id: string) {
  return db.cv.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/cv-service.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add CvService (TDD)"
```

---

### Task 5: Interviews + Notes API routes

**Files:**
- Create: `src/app/api/jobs/[id]/interviews/route.ts`
- Create: `src/app/api/interviews/[id]/route.ts`
- Create: `src/app/api/jobs/[id]/notes/route.ts`
- Create: `src/app/api/notes/[id]/route.ts`

- [ ] **Step 1: Write `src/app/api/jobs/[id]/interviews/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  listInterviewsForJob,
  createInterview,
} from "@/services/interview-service";
import { INTERVIEW_TYPES, type InterviewType } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(await listInterviewsForJob(params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  if (!INTERVIEW_TYPES.includes(body?.type)) {
    return NextResponse.json({ error: "valid type required" }, { status: 400 });
  }
  const iv = await createInterview(params.id, body as { type: InterviewType });
  return NextResponse.json(iv, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/interviews/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateInterview, deleteInterview } from "@/services/interview-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  return NextResponse.json(await updateInterview(params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteInterview(params.id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Write `src/app/api/jobs/[id]/notes/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { listNotesForJob, createNoteForJob } from "@/services/note-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(await listNotesForJob(params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  if (!body?.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  const note = await createNoteForJob(params.id, body.body);
  return NextResponse.json(note, { status: 201 });
}
```

- [ ] **Step 4: Write `src/app/api/notes/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { deleteNote } from "@/services/note-service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteNote(params.id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 5: Build to typecheck**

```bash
npm run build
```

Expected: build succeeds; routes `/api/jobs/[id]/interviews`, `/api/interviews/[id]`, `/api/jobs/[id]/notes`, `/api/notes/[id]` listed.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add interviews and notes API routes"
```

---

### Task 6: CV API routes (with file upload)

**Files:**
- Create: `src/app/api/cvs/route.ts`
- Create: `src/app/api/cvs/[id]/route.ts`

- [ ] **Step 1: Write `src/app/api/cvs/route.ts`** (GET list; POST handles multipart upload OR JSON paste)

```ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { listCvs, createCv } from "@/services/cv-service";

export async function GET() {
  return NextResponse.json(await listCvs());
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // JSON path: { label, content }
  if (contentType.includes("application/json")) {
    const body = await req.json();
    if (!body?.label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    const cv = await createCv({ label: body.label, content: body.content ?? null });
    return NextResponse.json(cv, { status: 201 });
  }

  // Multipart path: file upload
  const form = await req.formData();
  const label = String(form.get("label") ?? "").trim();
  const file = form.get("file") as File | null;
  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  let filePath: string | null = null;
  let content: string | null = null;

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(uploadsDir, safeName), bytes);
    filePath = `uploads/${safeName}`;

    // Auto-extract text only for plain-text files; PDFs/DOCX are pasted later.
    if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
      content = bytes.toString("utf-8");
    }
  }

  const cv = await createCv({ label, filePath, content });
  return NextResponse.json(cv, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/cvs/[id]/route.ts`** (PATCH sets default or edits content/label; DELETE)

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateCv, setDefaultCv, deleteCv } from "@/services/cv-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  if (body?.makeDefault === true) {
    return NextResponse.json(await setDefaultCv(params.id));
  }
  const { label, content } = body ?? {};
  return NextResponse.json(await updateCv(params.id, { label, content }));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteCv(params.id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Build to typecheck**

```bash
npm run build
```

Expected: build succeeds; `/api/cvs` and `/api/cvs/[id]` listed.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add CV API routes with file upload + text extraction"
```

---

### Task 7: Interview UI section on job detail

**Files:**
- Create: `src/components/InterviewSection.tsx`
- Modify: `src/app/jobs/[id]/page.tsx`

- [ ] **Step 1: Write `src/components/InterviewSection.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  INTERVIEW_TYPES,
  INTERVIEW_OUTCOMES,
  type InterviewType,
} from "@/lib/constants";

export interface InterviewRow {
  id: string;
  type: string;
  scheduledAt: string | null;
  outcome: string;
  prepNotes: string | null;
}

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function InterviewSection({
  jobId,
  interviews,
}: {
  jobId: string;
  interviews: InterviewRow[];
}) {
  const router = useRouter();
  const [type, setType] = useState<InterviewType>("PHONE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function addInterview(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/jobs/${jobId}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, scheduledAt: scheduledAt || null, prepNotes }),
    });
    setSaving(false);
    setScheduledAt("");
    setPrepNotes("");
    router.refresh();
  }

  async function setOutcome(id: string, outcome: string) {
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">Interviews</h2>

      <div className="flex flex-col gap-2">
        {interviews.length === 0 && (
          <p className="text-sm text-zinc-400">No interviews logged yet.</p>
        )}
        {interviews.map((iv) => (
          <div
            key={iv.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
          >
            <span className="font-medium text-zinc-700">{iv.type}</span>
            <span className="text-zinc-500">
              {iv.scheduledAt
                ? new Date(iv.scheduledAt).toLocaleString()
                : "unscheduled"}
            </span>
            <select
              value={iv.outcome}
              onChange={(e) => setOutcome(iv.id, e.target.value)}
              className="ml-auto rounded border border-zinc-200 px-2 py-1 text-xs"
            >
              {INTERVIEW_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <button
              onClick={() => remove(iv.id)}
              className="text-xs text-zinc-400 hover:text-rose-500"
            >
              delete
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={addInterview}
        className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4"
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InterviewType)}
          className={inputClass}
        >
          {INTERVIEW_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Prep notes"
          value={prepNotes}
          onChange={(e) => setPrepNotes(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Wire it into `src/app/jobs/[id]/page.tsx`** — add the import and render after the edit section. Add this import at the top:

```tsx
import InterviewSection from "@/components/InterviewSection";
```

And add this block immediately after the closing `</section>` of the "Edit job" section (before the final `</main>`):

```tsx
      <div className="mt-6">
        <InterviewSection
          jobId={job.id}
          interviews={job.interviews.map((iv) => ({
            id: iv.id,
            type: iv.type,
            scheduledAt: iv.scheduledAt ? iv.scheduledAt.toISOString() : null,
            outcome: iv.outcome,
            prepNotes: iv.prepNotes,
          }))}
        />
      </div>
```

(`job.interviews` is already included by `getJob`.)

- [ ] **Step 3: Build + manual check**

```bash
npm run build
```

Then `npm run dev`, open a job detail page, add an interview, change its outcome dropdown, delete it. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add interview logging UI on job detail"
```

---

### Task 8: Notes UI section on job detail

**Files:**
- Create: `src/components/NoteSection.tsx`
- Modify: `src/app/jobs/[id]/page.tsx`

- [ ] **Step 1: Write `src/components/NoteSection.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface NoteRow {
  id: string;
  body: string;
  createdAt: string;
}

export default function NoteSection({
  jobId,
  notes,
}: {
  jobId: string;
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await fetch(`/api/jobs/${jobId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSaving(false);
    setBody("");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">Notes</h2>

      <div className="flex flex-col gap-2">
        {notes.length === 0 && (
          <p className="text-sm text-zinc-400">No notes yet.</p>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className="group rounded-lg border border-zinc-100 px-3 py-2 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-zinc-700">{n.body}</p>
              <button
                onClick={() => remove(n.id)}
                className="shrink-0 text-xs text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:text-rose-500"
              >
                delete
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={addNote} className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
        <input
          placeholder="Add a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `src/app/jobs/[id]/page.tsx`** — add import:

```tsx
import NoteSection from "@/components/NoteSection";
```

And render after the `InterviewSection` block:

```tsx
      <div className="mt-6">
        <NoteSection
          jobId={job.id}
          notes={job.notes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
```

(`job.notes` is already included by `getJob`.)

- [ ] **Step 3: Build + manual check**

```bash
npm run build
```

Then `npm run dev`, open a job, add a note, delete a note. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add notes UI on job detail"
```

---

### Task 9: CV manager page + CV picker on job detail

**Files:**
- Create: `src/components/CvManager.tsx`
- Create: `src/app/cvs/page.tsx`
- Create: `src/components/CvPicker.tsx`
- Modify: `src/app/jobs/[id]/page.tsx`
- Modify: `src/app/layout.tsx` (add a CVs nav link)

- [ ] **Step 1: Write `src/components/CvManager.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CvRow {
  id: string;
  label: string;
  isDefault: boolean;
  hasFile: boolean;
  hasContent: boolean;
  createdAt: string;
}

export default function CvManager({ cvs }: { cvs: CvRow[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    if (file) {
      const fd = new FormData();
      fd.set("label", label);
      fd.set("file", file);
      await fetch("/api/cvs", { method: "POST", body: fd });
    } else {
      await fetch("/api/cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, content }),
      });
    }
    setSaving(false);
    setLabel("");
    setFile(null);
    setContent("");
    router.refresh();
  }

  async function makeDefault(id: string) {
    await fetch(`/api/cvs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ makeDefault: true }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/cvs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-2">
        {cvs.length === 0 && (
          <p className="text-sm text-zinc-400">No CVs yet. Upload one →</p>
        )}
        {cvs.map((cv) => (
          <div
            key={cv.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-800">{cv.label}</span>
                {cv.isDefault && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    default
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">
                {cv.hasFile ? "file uploaded" : cv.hasContent ? "text only" : "empty"}
                {" · "}
                {new Date(cv.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs">
              {!cv.isDefault && (
                <button
                  onClick={() => makeDefault(cv.id)}
                  className="text-indigo-600 hover:underline"
                >
                  set default
                </button>
              )}
              <button
                onClick={() => remove(cv.id)}
                className="text-zinc-400 hover:text-rose-500"
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </section>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">Add a CV</h2>
        <form onSubmit={upload} className="flex flex-col gap-3">
          <input
            placeholder="Label (e.g. Backend v2) *"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            required
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm"
          />
          <textarea
            placeholder="…or paste CV text here"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add CV"}
          </button>
        </form>
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/cvs/page.tsx`**

```tsx
import { listCvs } from "@/services/cv-service";
import CvManager from "@/components/CvManager";

export const dynamic = "force-dynamic";

export default async function CvsPage() {
  const cvs = await listCvs();
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        CV Manager
      </h1>
      <CvManager
        cvs={cvs.map((c) => ({
          id: c.id,
          label: c.label,
          isDefault: c.isDefault,
          hasFile: Boolean(c.filePath),
          hasContent: Boolean(c.content),
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
```

- [ ] **Step 3: Write `src/components/CvPicker.tsx`** (tags a CV to the current job via the existing jobs PATCH route)

```tsx
"use client";

import { useRouter } from "next/navigation";

export interface CvOption {
  id: string;
  label: string;
}

export default function CvPicker({
  jobId,
  cvId,
  options,
}: {
  jobId: string;
  cvId: string | null;
  options: CvOption[];
}) {
  const router = useRouter();

  async function assign(value: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvId: value || null }),
    });
    router.refresh();
  }

  return (
    <select
      value={cvId ?? ""}
      onChange={(e) => assign(e.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      <option value="">No CV tagged</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 4: Wire the CV picker into `src/app/jobs/[id]/page.tsx`.** Add imports:

```tsx
import CvPicker from "@/components/CvPicker";
import { listCvs } from "@/services/cv-service";
```

Change the function to load CVs (add after `const job = await getJob(...)` and the `notFound()` guard):

```tsx
  const cvs = await listCvs();
```

Then add this row inside the detail card's `<dl>`, as a new `<div>` (e.g. after the Salary block):

```tsx
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Tagged CV
            </dt>
            <dd className="mt-1">
              <CvPicker
                jobId={job.id}
                cvId={job.cvId}
                options={cvs.map((c) => ({ id: c.id, label: c.label }))}
              />
            </dd>
          </div>
```

- [ ] **Step 5: Add a CVs nav link in `src/app/layout.tsx`.** Inside the header `<div>`, after the `beta` badge span, add:

```tsx
            <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-600">
              <a href="/" className="hover:text-indigo-600">Board</a>
              <a href="/cvs" className="hover:text-indigo-600">CVs</a>
            </nav>
```

- [ ] **Step 6: Build + manual check**

```bash
npm run build
```

Then `npm run dev`: visit `/cvs`, add a CV by pasting text, add one by uploading a `.txt` file, set a default, delete one. Open a job detail page and tag a CV via the picker; refresh to confirm it persists. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add CV manager page and CV-to-job tagging"
```

---

### Task 10: Regression pass

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass — smoke, company-service (2), job-service (5), interview-service (4), note-service (2), cv-service (4). 18 total.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: succeeds, no type errors.

- [ ] **Step 3: Manual end-to-end smoke**

`npm run dev`, then confirm: open a job → log an interview, set outcome, add a note; go to `/cvs`, upload a CV, set default; back on the job, tag the CV. All persist on refresh.

- [ ] **Step 4: Reset dev DB to clean seed (optional tidy)**

```bash
npm run db:reset
```

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: Phase 2 regression pass green" --allow-empty
```

---

## Self-Review Notes

- **Spec coverage (§6 Phase 2):** log interviews per job (type/date/outcome/prep) ✓ Tasks 2,5,7; upload + store multiple CV versions ✓ Tasks 4,6,9; extract text ✓ Task 6 (plain-text now; PDF deferred to Phase 4 where it's consumed — flagged); tag CV→job ✓ Task 9 (reuses `Job.cvId`); free-form notes on jobs ✓ Tasks 3,5,8.
- **Type consistency:** `InterviewType`/`InterviewOutcome` defined in Task 1, used in services (Task 2), routes (Task 5), UI (Task 7). `createNoteForJob(jobId, body)` signature consistent across Tasks 3,5,8. `setDefaultCv`/`makeDefault` flag consistent across Tasks 4,6,9. `getJob` already includes `interviews` + `notes` (verified in Phase 1 `job-service.ts`).
- **Schema alignment:** uses `interviewNotes` relation only implicitly (we never query notes *through* an interview in Phase 2 — notes attach to jobs). Interview/Note/Cv models already migrated in Phase 0; no migration needed.
- **No placeholders:** every code step is complete and runnable.
- **No new dependencies:** file upload uses Node `fs/promises`; text extraction is `Buffer.toString`.

## Next step

Phase 3 (Dashboard) then Phase 4 (AI layer), each with its own plan.
