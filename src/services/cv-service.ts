import { db } from "@/lib/db";

export interface CvInput {
  label: string;
  content?: string | null;
  filePath?: string | null;
  isDefault?: boolean;
}

export function listCvs(userId: string) {
  return db.cv.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export function getCv(userId: string, id: string) {
  return db.cv.findFirst({ where: { id, userId } });
}

export function createCv(userId: string, input: CvInput) {
  return db.cv.create({
    data: { ...input, userId },
  });
}

export async function updateCv(userId: string, id: string, input: Partial<CvInput>) {
  await db.cv.updateMany({ where: { id, userId }, data: input });
  return db.cv.findFirst({ where: { id, userId } });
}

export async function setDefaultCv(userId: string, id: string) {
  await db.cv.updateMany({ where: { userId }, data: { isDefault: false } });
  await db.cv.updateMany({ where: { id, userId }, data: { isDefault: true } });
  return db.cv.findFirst({ where: { id, userId } });
}

export function deleteCv(userId: string, id: string) {
  return db.cv.deleteMany({ where: { id, userId } });
}
