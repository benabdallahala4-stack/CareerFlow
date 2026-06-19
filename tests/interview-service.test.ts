import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createInterview,
  listInterviewsForJob,
  updateInterview,
  deleteInterview,
  listInterviewsInRange,
  listUpcomingInterviews,
} from "@/services/interview-service";

const U = LOCAL_USER_ID;
let jobId: string;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  const job = await db.job.create({ data: { userId: U, title: "TEST_IV_Job" } });
  jobId = job.id;
});

afterEach(async () => {
  await db.interview.deleteMany({ where: { job: { title: "TEST_IV_Job" } } });
  await db.job.deleteMany({ where: { title: "TEST_IV_Job" } });
});

describe("InterviewService", () => {
  it("creates an interview with default PENDING outcome", async () => {
    const iv = await createInterview(U, jobId, { type: "TECHNICAL" });
    expect(iv.id).toBeTruthy();
    expect(iv.outcome).toBe("PENDING");
    expect(iv.jobId).toBe(jobId);
  });

  it("lists interviews for a job", async () => {
    await createInterview(U, jobId, { type: "PHONE" });
    await createInterview(U, jobId, { type: "HR" });
    const list = await listInterviewsForJob(U, jobId);
    expect(list.length).toBe(2);
  });

  it("updates outcome and prep notes", async () => {
    const iv = await createInterview(U, jobId, { type: "ONSITE" });
    const updated = await updateInterview(U, iv.id, {
      outcome: "PASSED",
      prepNotes: "Reviewed system design",
    });
    expect(updated?.outcome).toBe("PASSED");
    expect(updated?.prepNotes).toBe("Reviewed system design");
  });

  it("deletes an interview", async () => {
    const iv = await createInterview(U, jobId, { type: "FINAL" });
    await deleteInterview(U, iv.id);
    const list = await listInterviewsForJob(U, jobId);
    expect(list.length).toBe(0);
  });

  it("defaults stage from type on create", async () => {
    const iv = await createInterview(U, jobId, { type: "TECHNICAL" });
    expect(iv.stage).toBe("TECHNICAL");
    const hr = await createInterview(U, jobId, { type: "HR" });
    expect(hr.stage).toBe("SCREENING");
  });

  it("lists interviews in a date range and upcoming", async () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await createInterview(U, jobId, { type: "PHONE", scheduledAt: soon });
    await createInterview(U, jobId, { type: "ONSITE", scheduledAt: far });

    const startISO = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const endISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inRange = await listInterviewsInRange(U, startISO, endISO);
    expect(inRange.some((i) => i.job.title === "TEST_IV_Job")).toBe(true);
    expect(inRange.length).toBe(1); // only the "soon" one

    const upcoming = await listUpcomingInterviews(U, 10);
    expect(upcoming.length).toBeGreaterThanOrEqual(2);
    expect(upcoming[0].job).toBeTruthy();
  });
});
