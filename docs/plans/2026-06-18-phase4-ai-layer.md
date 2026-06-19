# CareerFlow OS — Phase 4: AI Layer Implementation Plan

> **For agentic workers:** Execute task-by-task. TDD on the pure logic (router fallback/priority, rule-based features, settings service). Adapters + prompt-building are typecheck + manual smoke.

**Goal:** A provider-agnostic AI layer — BYO API keys (Claude/OpenAI/Groq/Gemini/Ollama) routed by priority with graceful rule-based fallback — powering Match Score, CV Tailoring, Interview Prep, and a Career Chat. AI is always optional; features degrade, never break.

**Architecture:** A pure `runWithProviders()` core (testable, no network) tries adapters in priority order, falling back to a rule-based function when all fail or none are configured. `runFeature()` wires real `AiSetting` rows + provider adapters into that core and logs usage. Each feature = a prompt builder + a parser + a rule-based fallback. Keys live in the existing `AiSetting` table (plaintext, local-only — encryption deferred to Phase A).

**Tech Stack:** Next.js 14 · Prisma 6 · SQLite · Vitest. No new deps (adapters use `fetch`).

**Environment:** `/home/ala/gitlab/CareerFlow` via `wsl.exe bash -lc "cd ... && <cmd>"`. `userId = LOCAL_USER_ID`.

---

## File Structure

```
src/services/ai/
├── types.ts            # AiAdapter, AiResult, ProviderName, FeatureName
├── core.ts             # runWithProviders() — pure, testable
├── adapters.ts         # buildAdapter(provider, apiKey, model) via fetch
├── fallback.ts         # ruleBasedMatch(), genericPrepQuestions()
├── features.ts         # matchScore/tailorCv/interviewPrep/careerChat
└── router.ts           # runFeature() — loads settings, logs usage
src/services/ai-setting-service.ts   # CRUD for provider keys
src/app/api/ai/
├── settings/route.ts          # GET, POST
├── settings/[id]/route.ts     # PATCH, DELETE
├── match/route.ts             # POST {jobId}
├── tailor/route.ts            # POST {jobId}
├── prep/route.ts              # POST {jobId, interviewType}
└── chat/route.ts              # POST {messages}
src/app/settings/page.tsx      # provider management UI
src/app/assistant/page.tsx     # career chat UI
src/components/
├── AiSettingsManager.tsx
├── MatchScorePanel.tsx
├── TailorPanel.tsx
└── ChatPanel.tsx
```

---

### Task 1: AI types + pure router core (TDD)

**Files:**
- Create: `src/services/ai/types.ts`, `src/services/ai/core.ts`
- Test: `tests/ai-core.test.ts`

- [ ] **Step 1: Write `src/services/ai/types.ts`**

```ts
export const PROVIDERS = ["CLAUDE", "OPENAI", "GROQ", "GEMINI", "OLLAMA"] as const;
export type ProviderName = (typeof PROVIDERS)[number];

export const AI_FEATURES = ["MATCH", "TAILOR", "PREP", "CHAT"] as const;
export type FeatureName = (typeof AI_FEATURES)[number];

export interface AiResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

export interface AiAdapter {
  provider: ProviderName;
  run(prompt: string): Promise<AiResult>;
}
```

- [ ] **Step 2: Write the failing test** `tests/ai-core.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { runWithProviders } from "@/services/ai/core";
import type { AiAdapter } from "@/services/ai/types";

function fakeAdapter(text: string, fail = false): AiAdapter {
  return {
    provider: "GROQ",
    async run() {
      if (fail) throw new Error("provider down");
      return { text, tokensIn: 1, tokensOut: 2 };
    },
  };
}

describe("runWithProviders", () => {
  it("returns the first successful provider result", async () => {
    const res = await runWithProviders(
      [fakeAdapter("from-ai")],
      "prompt",
      () => "fallback"
    );
    expect(res.text).toBe("from-ai");
    expect(res.usedFallback).toBe(false);
  });

  it("skips a failing provider and uses the next", async () => {
    const res = await runWithProviders(
      [fakeAdapter("x", true), fakeAdapter("second")],
      "prompt",
      () => "fallback"
    );
    expect(res.text).toBe("second");
    expect(res.usedFallback).toBe(false);
  });

  it("uses rule-based fallback when all providers fail", async () => {
    const res = await runWithProviders(
      [fakeAdapter("x", true)],
      "prompt",
      () => "fallback-text"
    );
    expect(res.text).toBe("fallback-text");
    expect(res.usedFallback).toBe(true);
  });

  it("uses fallback when there are no providers", async () => {
    const res = await runWithProviders([], "prompt", () => "fb");
    expect(res.text).toBe("fb");
    expect(res.usedFallback).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/ai-core.test.ts
```

Expected: FAIL — cannot find `@/services/ai/core`.

- [ ] **Step 4: Write `src/services/ai/core.ts`**

```ts
import type { AiAdapter, ProviderName } from "./types";

export interface RunOutcome {
  text: string;
  tokensIn: number;
  tokensOut: number;
  usedFallback: boolean;
  provider: ProviderName | null;
}

/**
 * Try each adapter in order. Return the first success. If all throw (or the
 * list is empty), return the rule-based fallback text. Never throws.
 */
export async function runWithProviders(
  adapters: AiAdapter[],
  prompt: string,
  fallback: () => string
): Promise<RunOutcome> {
  for (const adapter of adapters) {
    try {
      const r = await adapter.run(prompt);
      return {
        text: r.text,
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        usedFallback: false,
        provider: adapter.provider,
      };
    } catch {
      // try next provider
    }
  }
  return {
    text: fallback(),
    tokensIn: 0,
    tokensOut: 0,
    usedFallback: true,
    provider: null,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/ai-core.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(ai): pure provider-routing core with fallback (TDD)"
```

---

### Task 2: Rule-based fallback (TDD)

**Files:**
- Create: `src/services/ai/fallback.ts`
- Test: `tests/ai-fallback.test.ts`

- [ ] **Step 1: Write the failing test** `tests/ai-fallback.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { ruleBasedMatch, genericPrepQuestions } from "@/services/ai/fallback";

describe("ruleBasedMatch", () => {
  it("scores keyword overlap and lists missing terms", () => {
    const cv = "Experienced Node.js and TypeScript developer with React";
    const jd = "We need a TypeScript engineer with React and GraphQL and AWS";
    const r = ruleBasedMatch(cv, jd);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.missing.map((m) => m.toLowerCase())).toContain("graphql");
    expect(r.missing.map((m) => m.toLowerCase())).toContain("aws");
  });

  it("returns 0 with empty inputs", () => {
    expect(ruleBasedMatch("", "").score).toBe(0);
  });
});

describe("genericPrepQuestions", () => {
  it("returns role-relevant questions for a type", () => {
    const qs = genericPrepQuestions("TECHNICAL");
    expect(qs.length).toBeGreaterThan(2);
    expect(typeof qs[0]).toBe("string");
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
npx vitest run tests/ai-fallback.test.ts
```

- [ ] **Step 3: Write `src/services/ai/fallback.ts`**

```ts
// Lightweight, dependency-free keyword analysis used when no AI is available.

const STOPWORDS = new Set([
  "the", "and", "a", "an", "to", "of", "in", "for", "with", "on", "at", "is",
  "are", "we", "you", "our", "your", "as", "be", "or", "this", "that", "will",
  "need", "needs", "looking", "experience", "experienced", "strong", "ability",
  "work", "team", "role", "years", "year", "plus", "etc", "including",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

export interface MatchResult {
  score: number; // 0..100
  missing: string[];
  matched: string[];
}

export function ruleBasedMatch(cvText: string, jobText: string): MatchResult {
  const cv = tokenize(cvText);
  const jd = tokenize(jobText);
  if (jd.size === 0 || cv.size === 0) return { score: 0, missing: [], matched: [] };

  const matched: string[] = [];
  const missing: string[] = [];
  for (const term of jd) {
    if (cv.has(term)) matched.push(term);
    else missing.push(term);
  }
  const score = Math.round((matched.length / jd.size) * 100);
  // surface the most useful missing terms (longest first, capped)
  missing.sort((a, b) => b.length - a.length);
  return { score, missing: missing.slice(0, 12), matched };
}

const PREP_BANK: Record<string, string[]> = {
  PHONE: [
    "Tell me about yourself and why this role.",
    "What do you know about our company?",
    "What are your salary expectations?",
    "Why are you leaving your current role?",
  ],
  TECHNICAL: [
    "Walk me through a challenging technical problem you solved.",
    "How would you design a scalable version of a feature you built?",
    "Explain a trade-off you made between speed and quality.",
    "How do you test and debug your code?",
  ],
  ONSITE: [
    "Describe how you collaborate with cross-functional teams.",
    "Tell me about a conflict and how you resolved it.",
    "How do you prioritize competing deadlines?",
  ],
  HR: [
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 3 years?",
    "Describe your ideal work environment.",
  ],
  FINAL: [
    "Why should we hire you over other candidates?",
    "What questions do you have for us?",
    "What impact do you want to make in the first 90 days?",
  ],
};

export function genericPrepQuestions(type: string): string[] {
  return PREP_BANK[type] ?? PREP_BANK.PHONE;
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npx vitest run tests/ai-fallback.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(ai): rule-based fallback (keyword match + prep bank) (TDD)"
```

---

### Task 3: Provider adapters (fetch-based)

**Files:**
- Create: `src/services/ai/adapters.ts`

These call real provider APIs; not unit-tested (network). Kept thin; verified by build + manual smoke with a real key.

- [ ] **Step 1: Write `src/services/ai/adapters.ts`**

```ts
import type { AiAdapter, AiResult, ProviderName } from "./types";

const DEFAULT_MODELS: Record<ProviderName, string> = {
  CLAUDE: "claude-haiku-4-5-20251001",
  OPENAI: "gpt-4o-mini",
  GROQ: "llama-3.3-70b-versatile",
  GEMINI: "gemini-1.5-flash",
  OLLAMA: "llama3.1",
};

// OpenAI + Groq share the OpenAI chat-completions shape.
function openAiCompatible(
  provider: ProviderName,
  baseUrl: string,
  apiKey: string,
  model: string
): AiAdapter {
  return {
    provider,
    async run(prompt: string): Promise<AiResult> {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });
      if (!res.ok) throw new Error(`${provider} ${res.status}`);
      const data = await res.json();
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        tokensIn: data.usage?.prompt_tokens ?? 0,
        tokensOut: data.usage?.completion_tokens ?? 0,
      };
    },
  };
}

function claudeAdapter(apiKey: string, model: string): AiAdapter {
  return {
    provider: "CLAUDE",
    async run(prompt: string): Promise<AiResult> {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`CLAUDE ${res.status}`);
      const data = await res.json();
      return {
        text: data.content?.[0]?.text ?? "",
        tokensIn: data.usage?.input_tokens ?? 0,
        tokensOut: data.usage?.output_tokens ?? 0,
      };
    },
  };
}

function geminiAdapter(apiKey: string, model: string): AiAdapter {
  return {
    provider: "GEMINI",
    async run(prompt: string): Promise<AiResult> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (!res.ok) throw new Error(`GEMINI ${res.status}`);
      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const usage = data.usageMetadata ?? {};
      return {
        text,
        tokensIn: usage.promptTokenCount ?? 0,
        tokensOut: usage.candidatesTokenCount ?? 0,
      };
    },
  };
}

function ollamaAdapter(model: string): AiAdapter {
  return {
    provider: "OLLAMA",
    async run(prompt: string): Promise<AiResult> {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
      });
      if (!res.ok) throw new Error(`OLLAMA ${res.status}`);
      const data = await res.json();
      return {
        text: data.response ?? "",
        tokensIn: data.prompt_eval_count ?? 0,
        tokensOut: data.eval_count ?? 0,
      };
    },
  };
}

export function buildAdapter(
  provider: ProviderName,
  apiKey: string | null,
  model: string | null
): AiAdapter {
  const m = model || DEFAULT_MODELS[provider];
  const key = apiKey ?? "";
  switch (provider) {
    case "OPENAI":
      return openAiCompatible("OPENAI", "https://api.openai.com/v1", key, m);
    case "GROQ":
      return openAiCompatible("GROQ", "https://api.groq.com/openai/v1", key, m);
    case "CLAUDE":
      return claudeAdapter(key, m);
    case "GEMINI":
      return geminiAdapter(key, m);
    case "OLLAMA":
      return ollamaAdapter(m);
  }
}
```

- [ ] **Step 2: Build to typecheck**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(ai): fetch-based provider adapters (Claude/OpenAI/Groq/Gemini/Ollama)"
```

---

### Task 4: AiSettingService (TDD)

**Files:**
- Create: `src/services/ai-setting-service.ts`
- Test: `tests/ai-setting-service.test.ts`

- [ ] **Step 1: Write the failing test** `tests/ai-setting-service.test.ts`

```ts
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  listAiSettings,
  createAiSetting,
  updateAiSetting,
  deleteAiSetting,
  activeProvidersByPriority,
} from "@/services/ai-setting-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(ensureUser);

afterEach(async () => {
  await db.aiSetting.deleteMany({ where: { userId: LOCAL_USER_ID } });
});

describe("AiSettingService", () => {
  it("creates and lists provider settings", async () => {
    await createAiSetting({ provider: "GROQ", apiKey: "k1", priority: 1 });
    const list = await listAiSettings();
    expect(list.length).toBe(1);
    expect(list[0].provider).toBe("GROQ");
  });

  it("returns active providers sorted by priority asc", async () => {
    await createAiSetting({ provider: "OPENAI", apiKey: "k2", priority: 2 });
    await createAiSetting({ provider: "GROQ", apiKey: "k1", priority: 1 });
    await createAiSetting({ provider: "GEMINI", apiKey: "k3", priority: 3, isActive: false });
    const active = await activeProvidersByPriority();
    expect(active.map((a) => a.provider)).toEqual(["GROQ", "OPENAI"]);
  });

  it("updates and deletes", async () => {
    const s = await createAiSetting({ provider: "CLAUDE", apiKey: "k" });
    const upd = await updateAiSetting(s.id, { isActive: false });
    expect(upd.isActive).toBe(false);
    await deleteAiSetting(s.id);
    expect((await listAiSettings()).length).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify fail.** `npx vitest run tests/ai-setting-service.test.ts`

- [ ] **Step 3: Write `src/services/ai-setting-service.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import type { ProviderName } from "./ai/types";

export interface AiSettingInput {
  provider: ProviderName;
  apiKey?: string | null;
  model?: string | null;
  isActive?: boolean;
  priority?: number;
}

export function listAiSettings() {
  return db.aiSetting.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { priority: "asc" },
  });
}

export function createAiSetting(input: AiSettingInput) {
  return db.aiSetting.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateAiSetting(id: string, input: Partial<AiSettingInput>) {
  return db.aiSetting.update({ where: { id }, data: input });
}

export function deleteAiSetting(id: string) {
  return db.aiSetting.delete({ where: { id } });
}

export function activeProvidersByPriority() {
  return db.aiSetting.findMany({
    where: { userId: LOCAL_USER_ID, isActive: true },
    orderBy: { priority: "asc" },
  });
}
```

- [ ] **Step 4: Run to verify pass.** Expected: PASS (3 tests).

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(ai): AiSettingService for BYO provider keys (TDD)"`

---

### Task 5: Feature functions + router

**Files:**
- Create: `src/services/ai/features.ts`, `src/services/ai/router.ts`

- [ ] **Step 1: Write `src/services/ai/router.ts`**

```ts
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { activeProvidersByPriority } from "../ai-setting-service";
import { buildAdapter } from "./adapters";
import { runWithProviders, type RunOutcome } from "./core";
import type { FeatureName, ProviderName } from "./types";

/**
 * Run a feature prompt through the user's configured providers (priority order),
 * falling back to the supplied rule-based text. Logs usage. Never throws.
 */
export async function runFeature(
  feature: FeatureName,
  prompt: string,
  fallback: () => string
): Promise<RunOutcome> {
  const settings = await activeProvidersByPriority();
  const adapters = settings.map((s) =>
    buildAdapter(s.provider as ProviderName, s.apiKey, s.model)
  );

  const outcome = await runWithProviders(adapters, prompt, fallback);

  if (!outcome.usedFallback && outcome.provider) {
    await db.aiUsageLog.create({
      data: {
        userId: LOCAL_USER_ID,
        provider: outcome.provider,
        feature,
        tokensIn: outcome.tokensIn,
        tokensOut: outcome.tokensOut,
      },
    });
  }

  return outcome;
}
```

- [ ] **Step 2: Write `src/services/ai/features.ts`**

```ts
import { runFeature } from "./router";
import { ruleBasedMatch, genericPrepQuestions } from "./fallback";

export interface MatchOutput {
  raw: string;
  usedFallback: boolean;
  score: number | null;
  missing: string[];
}

export async function matchScore(cv: string, jobDescription: string): Promise<MatchOutput> {
  const rb = ruleBasedMatch(cv, jobDescription);
  const prompt = `You are an ATS expert. Given this CV and job description, reply with a single line "SCORE: <0-100>" then a short bullet list of the most important missing keywords/skills.\n\n=== CV ===\n${cv}\n\n=== JOB ===\n${jobDescription}`;

  const outcome = await runFeature("MATCH", prompt, () =>
    `SCORE: ${rb.score}\nMissing: ${rb.missing.join(", ") || "none detected"}`
  );

  // Parse "SCORE: NN" out of whatever came back (AI or fallback).
  const m = outcome.text.match(/SCORE:\s*(\d{1,3})/i);
  const score = m ? Math.min(100, parseInt(m[1], 10)) : rb.score;

  return {
    raw: outcome.text,
    usedFallback: outcome.usedFallback,
    score,
    missing: rb.missing,
  };
}

export interface TextOutput {
  text: string;
  usedFallback: boolean;
}

export async function tailorCv(cv: string, jobDescription: string): Promise<TextOutput> {
  const prompt = `Rewrite/suggest 5-8 improved resume bullet points to better match this job. Be specific and ATS-friendly.\n\n=== CV ===\n${cv}\n\n=== JOB ===\n${jobDescription}`;
  const outcome = await runFeature("TAILOR", prompt, () =>
    "Add a free Groq or Gemini API key in Settings to unlock AI tailoring. Meanwhile, mirror the exact keywords from the job description in your bullet points and lead each with a measurable result."
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}

export async function interviewPrep(
  role: string,
  cv: string,
  interviewType: string
): Promise<TextOutput> {
  const prompt = `Generate 6 likely ${interviewType} interview questions for the role "${role}", plus a one-line prep tip each. Use the candidate CV for relevance.\n\n=== CV ===\n${cv}`;
  const outcome = await runFeature("PREP", prompt, () =>
    genericPrepQuestions(interviewType).map((q, i) => `${i + 1}. ${q}`).join("\n")
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}

export async function careerChat(history: string, cvContext: string): Promise<TextOutput> {
  const prompt = `You are a concise career assistant. Use the candidate context to answer the latest message helpfully.\n\n=== CONTEXT ===\n${cvContext}\n\n=== CONVERSATION ===\n${history}`;
  const outcome = await runFeature("CHAT", prompt, () =>
    "Add a free Groq or Gemini API key in Settings to chat with your AI career assistant. Until then, focus on tailoring each application and following up after 7 days of silence."
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}
```

- [ ] **Step 3: Build to typecheck.** `npm run build`

- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat(ai): router with usage logging + 4 feature functions"`

---

### Task 6: AI API routes

**Files:**
- Create: `src/app/api/ai/settings/route.ts`, `src/app/api/ai/settings/[id]/route.ts`
- Create: `src/app/api/ai/match/route.ts`, `tailor/route.ts`, `prep/route.ts`, `chat/route.ts`

- [ ] **Step 1: `src/app/api/ai/settings/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { listAiSettings, createAiSetting } from "@/services/ai-setting-service";
import { PROVIDERS, type ProviderName } from "@/services/ai/types";

export async function GET() {
  const settings = await listAiSettings();
  // Do not leak full keys to the client.
  return NextResponse.json(
    settings.map((s) => ({
      id: s.id,
      provider: s.provider,
      model: s.model,
      isActive: s.isActive,
      priority: s.priority,
      hasKey: Boolean(s.apiKey),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!PROVIDERS.includes(body?.provider)) {
    return NextResponse.json({ error: "valid provider required" }, { status: 400 });
  }
  const created = await createAiSetting({
    provider: body.provider as ProviderName,
    apiKey: body.apiKey ?? null,
    model: body.model ?? null,
    priority: typeof body.priority === "number" ? body.priority : 0,
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
```

- [ ] **Step 2: `src/app/api/ai/settings/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateAiSetting, deleteAiSetting } from "@/services/ai-setting-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
  if (typeof body.priority === "number") allowed.priority = body.priority;
  if (typeof body.model === "string") allowed.model = body.model;
  if (typeof body.apiKey === "string") allowed.apiKey = body.apiKey;
  await updateAiSetting(params.id, allowed);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteAiSetting(params.id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: `src/app/api/ai/match/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCv } from "@/services/cv-service";
import { matchScore } from "@/services/ai/features";

export async function POST(req: NextRequest) {
  const { jobId } = await req.json();
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  const cv = job.cvId ? await getCv(job.cvId) : null;
  const cvText = cv?.content ?? "";
  const jd = `${job.title}\n${job.description ?? ""}`;
  const result = await matchScore(cvText, jd);
  return NextResponse.json(result);
}
```

- [ ] **Step 4: `src/app/api/ai/tailor/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCv } from "@/services/cv-service";
import { tailorCv } from "@/services/ai/features";

export async function POST(req: NextRequest) {
  const { jobId } = await req.json();
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  const cv = job.cvId ? await getCv(job.cvId) : null;
  const result = await tailorCv(cv?.content ?? "", `${job.title}\n${job.description ?? ""}`);
  return NextResponse.json(result);
}
```

- [ ] **Step 5: `src/app/api/ai/prep/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCv } from "@/services/cv-service";
import { interviewPrep } from "@/services/ai/features";

export async function POST(req: NextRequest) {
  const { jobId, interviewType } = await req.json();
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  const cv = job.cvId ? await getCv(job.cvId) : null;
  const result = await interviewPrep(job.title, cv?.content ?? "", interviewType ?? "PHONE");
  return NextResponse.json(result);
}
```

- [ ] **Step 6: `src/app/api/ai/chat/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { careerChat } from "@/services/ai/features";
import { listCvs } from "@/services/cv-service";
import { listJobs } from "@/services/job-service";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const history = (messages ?? [])
    .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
    .join("\n");

  const cvs = await listCvs();
  const jobs = await listJobs();
  const defaultCv = cvs.find((c) => c.isDefault) ?? cvs[0];
  const context = `Default CV:\n${defaultCv?.content ?? "none"}\n\nApplications: ${jobs
    .map((j) => `${j.title} (${j.status})`)
    .join(", ")}`;

  const result = await careerChat(history, context);
  return NextResponse.json(result);
}
```

- [ ] **Step 7: Build.** `npm run build` — all `/api/ai/*` routes listed.

- [ ] **Step 8: Commit.** `git add -A && git commit -m "feat(ai): REST routes for settings + match/tailor/prep/chat"`

---

### Task 7: Settings UI

**Files:**
- Create: `src/components/AiSettingsManager.tsx`, `src/app/settings/page.tsx`
- Modify: `src/app/layout.tsx` (nav link)

- [ ] **Step 1: `src/components/AiSettingsManager.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDERS, type ProviderName } from "@/services/ai/types";

export interface SettingRow {
  id: string;
  provider: string;
  model: string | null;
  isActive: boolean;
  priority: number;
  hasKey: boolean;
}

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function AiSettingsManager({ settings }: { settings: SettingRow[] }) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderName>("GROQ");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/ai/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model: model || null, priority }),
    });
    setSaving(false);
    setApiKey("");
    setModel("");
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/ai/settings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/ai/settings/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-2">
        {settings.length === 0 && (
          <p className="text-sm text-zinc-400">
            No AI providers yet. Add a free Groq or Gemini key to enable AI features.
          </p>
        )}
        {settings.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="font-medium text-zinc-800">{s.provider}</span>
            <span className="text-xs text-zinc-400">
              priority {s.priority} · {s.hasKey ? "key set" : "no key"}
              {s.model ? ` · ${s.model}` : ""}
            </span>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={s.isActive}
                onChange={(e) => toggle(s.id, e.target.checked)}
              />
              active
            </label>
            <button
              onClick={() => remove(s.id)}
              className="text-xs text-zinc-400 hover:text-rose-500"
            >
              delete
            </button>
          </div>
        ))}
      </section>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-zinc-800">Add provider</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Keys are stored locally only. Groq &amp; Gemini have free tiers.
        </p>
        <form onSubmit={add} className="flex flex-col gap-3">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ProviderName)}
            className={inputClass}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="API key (blank for Ollama)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Model (optional)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Priority (1 = first)"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value || "1", 10))}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add provider"}
          </button>
        </form>
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: `src/app/settings/page.tsx`**

```tsx
import { listAiSettings } from "@/services/ai-setting-service";
import AiSettingsManager from "@/components/AiSettingsManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await listAiSettings();
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-zinc-900">
        AI Settings
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Connect your own AI provider. Everything works without one — AI just makes it better.
      </p>
      <AiSettingsManager
        settings={settings.map((s) => ({
          id: s.id,
          provider: s.provider,
          model: s.model,
          isActive: s.isActive,
          priority: s.priority,
          hasKey: Boolean(s.apiKey),
        }))}
      />
    </main>
  );
}
```

- [ ] **Step 3: Nav link in `src/app/layout.tsx`** — add to `<nav>` after CVs:

```tsx
              <a href="/settings" className="hover:text-indigo-600">Settings</a>
```

- [ ] **Step 4: Build + commit.** `npm run build` then `git add -A && git commit -m "feat(ai): settings UI for provider management"`

---

### Task 8: AI panels on job detail + assistant chat page

**Files:**
- Create: `src/components/MatchScorePanel.tsx`, `src/components/TailorPanel.tsx`, `src/components/ChatPanel.tsx`
- Create: `src/app/assistant/page.tsx`
- Modify: `src/app/jobs/[id]/page.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: `src/components/MatchScorePanel.tsx`**

```tsx
"use client";

import { useState } from "react";

export default function MatchScorePanel({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number | null;
    missing: string[];
    usedFallback: boolean;
  } | null>(null);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">CV match score</h2>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {result.score ?? "—"}
            </span>
            <span className="text-sm text-zinc-400">/ 100</span>
            {result.usedFallback && (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                keyword match (no AI key)
              </span>
            )}
          </div>
          {result.missing.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Missing keywords
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.missing.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-zinc-400">
            Tag a CV with content on this job for the most accurate score.
          </p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: `src/components/TailorPanel.tsx`**

```tsx
"use client";

import { useState } from "react";

export default function TailorPanel({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    setText(data.text);
    setFallback(data.usedFallback);
    setLoading(false);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Tailor CV to this job</h2>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Working…" : "Suggest"}
        </button>
      </div>
      {text && (
        <>
          {fallback && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No AI key configured — showing general guidance.
            </p>
          )}
          <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{text}</pre>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: `src/components/ChatPanel.tsx`**

```tsx
"use client";

import { useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const data = await res.json();
    setMessages([...next, { role: "assistant", content: data.text }]);
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-400">
            Ask anything about your job search. Add an AI key in Settings for smart answers.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-indigo-600 text-white"
                : "self-start bg-zinc-100 text-zinc-800"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: `src/app/assistant/page.tsx`**

```tsx
import ChatPanel from "@/components/ChatPanel";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        Career Assistant
      </h1>
      <ChatPanel />
    </main>
  );
}
```

- [ ] **Step 5: Wire panels into `src/app/jobs/[id]/page.tsx`.** Add imports:

```tsx
import MatchScorePanel from "@/components/MatchScorePanel";
import TailorPanel from "@/components/TailorPanel";
```

Add, right after the detail card `</div>` (before the Interviews block):

```tsx
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <MatchScorePanel jobId={job.id} />
        <TailorPanel jobId={job.id} />
      </div>
```

- [ ] **Step 6: Nav links in `src/app/layout.tsx`** — add to `<nav>` after Dashboard:

```tsx
              <a href="/assistant" className="hover:text-indigo-600">Assistant</a>
```

- [ ] **Step 7: Build + manual smoke.** `npm run build`. Then `npm run dev`: open a job → "Analyze" shows a keyword match score (works with no AI key); add a Groq key in `/settings` → Analyze again gives an AI score; `/assistant` chat returns fallback guidance with no key. Stop server.

- [ ] **Step 8: Commit.** `git add -A && git commit -m "feat(ai): match/tailor panels on job detail + assistant chat page"`

---

### Task 9: Regression

- [ ] **Step 1:** `npm test` — all prior + new AI core/fallback/setting tests pass.
- [ ] **Step 2:** `npm run build` — clean.
- [ ] **Step 3:** `npm run db:reset` (clean seed).
- [ ] **Step 4:** Commit `chore: Phase 4 regression pass` (--allow-empty).

---

## Self-Review Notes

- **Spec coverage (§5 AI):** provider-agnostic router w/ priority + fallback ✓ (Tasks 1,5); adapters Claude/OpenAI/Groq/Gemini/Ollama ✓ (Task 3); BYO keys ✓ (Tasks 4,7); Match/Tailor/Prep/Chat ✓ (Tasks 5,6,8); rule-based fallback so it works with no key ✓ (Task 2); AiUsageLog ✓ (Task 5 router); never AI-dependent ✓ (every feature has a fallback).
- **Deferred/flagged:** keys stored plaintext (local-only; encryption = Phase A); PDF text extraction still manual (Phase 2 note) — match score is best when the tagged CV has pasted content; interview-prep UI button reuses `/api/ai/prep` but is surfaced minimally (panel can be added later; route + feature exist now).
- **Type consistency:** `ProviderName`/`FeatureName` from `ai/types.ts` used across adapters, router, services, routes, UI. `runFeature(feature, prompt, fallback)` signature consistent. `RunOutcome.usedFallback` consumed by features and surfaced in panels.
- **No new dependencies.**

## Next step

Phase A (SaaS): auth/multi-user, SQLite→Postgres, n8n email automation, notifications, billing/credits (AiUsageLog is the meter), deployment — each its own plan, only once the free product is proven in daily use.
