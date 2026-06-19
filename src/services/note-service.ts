import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";

export function listNotesForJob(jobId: string) {
  return db.note.findMany({
    where: { jobId, userId: LOCAL_USER_ID },
    orderBy: { createdAt: "desc" },
  });
}

export function createNoteForJob(jobId: string, body: string) {
  return db.note.create({
    data: { jobId, body, userId: LOCAL_USER_ID },
  });
}

export function deleteNote(id: string) {
  return db.note.delete({ where: { id } });
}
