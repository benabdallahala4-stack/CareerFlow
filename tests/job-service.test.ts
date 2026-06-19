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

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

afterEach(async () => {
  await db.job.deleteMany({ where: { title: { startsWith: "TEST_" } } });
});

describe("JobService", () => {
  it("creates a job with default WISHLIST status", async () => {
    await ensureUser();
    const job = await createJob(U, { title: "TEST_Backend Engineer" });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("WISHLIST");
  });

  it("lists jobs and fetches one by id", async () => {
    await ensureUser();
    const job = await createJob(U, { title: "TEST_Lister" });
    const all = await listJobs(U);
    expect(all.some((j) => j.id === job.id)).toBe(true);
    const one = await getJob(U, job.id);
    expect(one?.title).toBe("TEST_Lister");
  });

  it("updates fields", async () => {
    await ensureUser();
    const job = await createJob(U, { title: "TEST_Update" });
    const updated = await updateJob(U, job.id, { salary: "100k", location: "Berlin" });
    expect(updated?.salary).toBe("100k");
    expect(updated?.location).toBe("Berlin");
  });

  it("moves status and sets appliedAt when entering APPLIED", async () => {
    await ensureUser();
    const job = await createJob(U, { title: "TEST_Status" });
    const moved = await updateJobStatus(U, job.id, "APPLIED", 0);
    expect(moved?.status).toBe("APPLIED");
    expect(moved?.appliedAt).not.toBeNull();
    expect(moved?.boardOrder).toBe(0);
  });

  it("deletes a job", async () => {
    await ensureUser();
    const job = await createJob(U, { title: "TEST_Delete" });
    await deleteJob(U, job.id);
    expect(await getJob(U, job.id)).toBeNull();
  });
});
