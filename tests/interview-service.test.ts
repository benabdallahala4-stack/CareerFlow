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
