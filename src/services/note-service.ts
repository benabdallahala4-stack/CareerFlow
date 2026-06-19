import { db } from "@/lib/db";

export function listNotesForJob(userId: string, jobId: string) {
  return db.note.findMany({
    where: { jobId, userId },
    orderBy: { createdAt: "desc" },
  });
}

export function createNoteForJob(userId: string, jobId: string, body: string) {
  return db.note.create({
    data: { jobId, body, userId },
  });
}

export function deleteNote(userId: string, id: string) {
  return db.note.deleteMany({ where: { id, userId } });
}
