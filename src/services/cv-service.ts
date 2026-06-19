import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";

export interface CvInput {
  label: string;
  content?: string | null;
  filePath?: string | null;
  isDefault?: boolean;
}

export function listCvs() {
  return db.cv.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export function getCv(id: string) {
  return db.cv.findFirst({ where: { id, userId: LOCAL_USER_ID } });
}

export function createCv(input: CvInput) {
  return db.cv.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateCv(id: string, input: Partial<CvInput>) {
  return db.cv.update({ where: { id }, data: input });
}

export async function setDefaultCv(id: string) {
  await db.cv.updateMany({
    where: { userId: LOCAL_USER_ID },
    data: { isDefault: false },
  });
  return db.cv.update({ where: { id }, data: { isDefault: true } });
}

export function deleteCv(id: string) {
  return db.cv.delete({ where: { id } });
}
