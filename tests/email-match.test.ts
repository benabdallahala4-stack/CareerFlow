import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { matchJobForEmail } from "@/services/email/match";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

async function cleanup() {
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_M_" } } });
  await db.company.deleteMany({ where: { name: { startsWith: "TEST_M_" } } });
}

beforeEach(async () => {
  await ensureUser();
  await cleanup();
});
afterEach(cleanup);

describe("matchJobForEmail", () => {
  it("matches by sender domain to company website", async () => {
    const c = await db.company.create({
      data: { userId: U, name: "TEST_M_Acme", website: "https://acme.com" },
    });
    const job = await db.job.create({ data: { userId: U, title: "TEST_M_Eng", companyId: c.id } });
    const id = await matchJobForEmail(U, "recruiter@acme.com", "Hi", "Let's chat");
    expect(id).toBe(job.id);
  });

  it("matches by company name appearing in the email", async () => {
    const c = await db.company.create({ data: { userId: U, name: "TEST_M_Globex" } });
    const job = await db.job.create({ data: { userId: U, title: "TEST_M_Dev", companyId: c.id } });
    const id = await matchJobForEmail(U, "noreply@mailer.io", "TEST_M_Globex interview", "details");
    expect(id).toBe(job.id);
  });

  it("returns null when nothing matches", async () => {
    const c = await db.company.create({
      data: { userId: U, name: "TEST_M_Acme", website: "https://acme.com" },
    });
    await db.job.create({ data: { userId: U, title: "TEST_M_Eng", companyId: c.id } });
    const id = await matchJobForEmail(U, "x@unrelated.com", "hello", "world");
    expect(id).toBeNull();
  });
});
