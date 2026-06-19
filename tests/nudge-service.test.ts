import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { computeNudges } from "@/services/nudge-service";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  await db.interview.deleteMany({ where: { job: { title: { startsWith: "TEST_N_" } } } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_N_" } } });
});

afterEach(async () => {
  await db.interview.deleteMany({ where: { job: { title: { startsWith: "TEST_N_" } } } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_N_" } } });
});

describe("computeNudges", () => {
  it("flags a stale APPLIED job for follow-up", async () => {
    const job = await db.job.create({
      data: { userId: U, title: "TEST_N_stale", status: "APPLIED" },
    });
    // Backdate updatedAt past the 7-day window (Prisma @updatedAt can't be set normally).
    await db.$executeRawUnsafe(
      `UPDATE "Job" SET "updatedAt" = now() - interval '10 days' WHERE id = $1`,
      job.id
    );
    const nudges = await computeNudges(U);
    expect(nudges.some((n) => n.kind === "FOLLOW_UP" && n.jobId === job.id)).toBe(true);
  });

  it("flags an INTERVIEW job with no CV tagged", async () => {
    const job = await db.job.create({
      data: { userId: U, title: "TEST_N_nocv", status: "INTERVIEW" },
    });
    const nudges = await computeNudges(U);
    expect(nudges.some((n) => n.kind === "TAG_CV" && n.jobId === job.id)).toBe(true);
  });

  it("flags an upcoming interview missing prep notes", async () => {
    const job = await db.job.create({
      data: { userId: U, title: "TEST_N_prep", status: "INTERVIEW" },
    });
    await db.interview.create({
      data: {
        userId: U,
        jobId: job.id,
        type: "TECHNICAL",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });
    const nudges = await computeNudges(U);
    expect(nudges.some((n) => n.kind === "ADD_PREP" && n.jobId === job.id)).toBe(true);
  });

  it("does not flag a fresh wishlist job", async () => {
    const job = await db.job.create({
      data: { userId: U, title: "TEST_N_fresh", status: "WISHLIST" },
    });
    const nudges = await computeNudges(U);
    expect(nudges.some((n) => n.jobId === job.id)).toBe(false);
  });
});
