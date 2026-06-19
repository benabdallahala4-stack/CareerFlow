import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { computeStats } from "@/services/stats-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  await db.interview.deleteMany({ where: { job: { title: { startsWith: "TEST_S_" } } } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_S_" } } });
});

afterEach(async () => {
  await db.interview.deleteMany({ where: { job: { title: { startsWith: "TEST_S_" } } } });
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_S_" } } });
});

describe("StatsService", () => {
  it("counts by status and total", async () => {
    await db.job.createMany({
      data: [
        { userId: LOCAL_USER_ID, title: "TEST_S_a", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_b", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_c", status: "INTERVIEW" },
        { userId: LOCAL_USER_ID, title: "TEST_S_d", status: "OFFER" },
        { userId: LOCAL_USER_ID, title: "TEST_S_e", status: "WISHLIST" },
      ],
    });
    const stats = await computeStats();
    expect(stats.total).toBeGreaterThanOrEqual(5);
    expect(stats.byStatus.APPLIED).toBeGreaterThanOrEqual(2);
    expect(stats.byStatus.INTERVIEW).toBeGreaterThanOrEqual(1);
    expect(stats.offers).toBeGreaterThanOrEqual(1);
  });

  it("computes response rate within 0..100", async () => {
    await db.job.createMany({
      data: [
        { userId: LOCAL_USER_ID, title: "TEST_S_app1", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_app2", status: "APPLIED" },
        { userId: LOCAL_USER_ID, title: "TEST_S_iv", status: "INTERVIEW" },
        { userId: LOCAL_USER_ID, title: "TEST_S_off", status: "OFFER" },
        { userId: LOCAL_USER_ID, title: "TEST_S_wish", status: "WISHLIST" },
      ],
    });
    const stats = await computeStats();
    expect(stats.responseRate).toBeGreaterThanOrEqual(0);
    expect(stats.responseRate).toBeLessThanOrEqual(100);
  });

  it("counts interviews scheduled in the next 7 days", async () => {
    const job = await db.job.create({
      data: { userId: LOCAL_USER_ID, title: "TEST_S_ivjob", status: "INTERVIEW" },
    });
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await db.interview.create({
      data: { userId: LOCAL_USER_ID, jobId: job.id, type: "PHONE", scheduledAt: inThreeDays },
    });
    const stats = await computeStats();
    expect(stats.interviewsThisWeek).toBeGreaterThanOrEqual(1);
  });
});
