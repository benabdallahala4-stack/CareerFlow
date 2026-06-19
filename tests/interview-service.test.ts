import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createInterview,
  listInterviewsForJob,
  updateInterview,
  deleteInterview,
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
});
