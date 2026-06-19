import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createNoteForJob,
  listNotesForJob,
  deleteNote,
} from "@/services/note-service";

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
  const job = await db.job.create({ data: { userId: U, title: "TEST_NOTE_Job" } });
  jobId = job.id;
});

afterEach(async () => {
  await db.note.deleteMany({ where: { job: { title: "TEST_NOTE_Job" } } });
  await db.job.deleteMany({ where: { title: "TEST_NOTE_Job" } });
});

describe("NoteService", () => {
  it("creates and lists notes for a job (newest first)", async () => {
    await createNoteForJob(U, jobId, "First note");
    await createNoteForJob(U, jobId, "Second note");
    const list = await listNotesForJob(U, jobId);
    expect(list.length).toBe(2);
    expect(list[0].body).toBe("Second note");
  });

  it("deletes a note", async () => {
    const n = await createNoteForJob(U, jobId, "Delete me");
    await deleteNote(U, n.id);
    const list = await listNotesForJob(U, jobId);
    expect(list.length).toBe(0);
  });
});
