import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { processIncomingEmail } from "@/services/email/process";
import {
  listPendingSuggestions,
  applySuggestion,
  dismissSuggestion,
} from "@/services/suggestion-service";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

async function cleanup() {
  await db.emailSuggestion.deleteMany({ where: { userId: U } });
  await db.notification.deleteMany({ where: { userId: U } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_P_" } } });
  await db.company.deleteMany({ where: { name: { startsWith: "TEST_P_" } } });
}

beforeEach(async () => {
  await ensureUser();
  await cleanup();
});
afterEach(cleanup);

async function seedJob(status = "APPLIED") {
  const c = await db.company.create({
    data: { userId: U, name: "TEST_P_Acme", website: "https://acme.com" },
  });
  return db.job.create({ data: { userId: U, title: "TEST_P_Eng", companyId: c.id, status } });
}

describe("email suggestion flow", () => {
  it("creates a pending suggestion for an interview email", async () => {
    const job = await seedJob();
    const res = await processIncomingEmail(U, {
      from: "recruiter@acme.com",
      subject: "Next steps",
      body: "We'd like to schedule a call.",
    });
    expect(res.classification).toBe("INTERVIEW");
    expect(res.jobId).toBe(job.id);
    expect(res.suggestionId).toBeTruthy();

    const pending = await listPendingSuggestions(U);
    expect(pending.length).toBe(1);
    expect(pending[0].proposedStatus).toBe("INTERVIEW");
  });

  it("does not duplicate a suggestion for the same email", async () => {
    await seedJob();
    const email = { from: "recruiter@acme.com", subject: "Next steps", body: "schedule a call" };
    await processIncomingEmail(U, email);
    await processIncomingEmail(U, email);
    expect((await listPendingSuggestions(U)).length).toBe(1);
  });

  it("apply moves the job to the proposed status and marks applied", async () => {
    const job = await seedJob();
    const res = await processIncomingEmail(U, {
      from: "recruiter@acme.com",
      subject: "Next steps",
      body: "schedule a call",
    });
    await applySuggestion(U, res.suggestionId!);

    const updated = await db.job.findUnique({ where: { id: job.id } });
    expect(updated?.status).toBe("INTERVIEW");
    expect((await listPendingSuggestions(U)).length).toBe(0);
  });

  it("dismiss removes it from pending without changing the job", async () => {
    const job = await seedJob();
    const res = await processIncomingEmail(U, {
      from: "recruiter@acme.com",
      subject: "Next steps",
      body: "schedule a call",
    });
    await dismissSuggestion(U, res.suggestionId!);
    expect((await listPendingSuggestions(U)).length).toBe(0);
    const unchanged = await db.job.findUnique({ where: { id: job.id } });
    expect(unchanged?.status).toBe("APPLIED");
  });
});
