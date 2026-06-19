import { db } from "@/lib/db";
import type { ProviderName } from "./ai/types";

export interface AiSettingInput {
  provider: ProviderName;
  apiKey?: string | null;
  model?: string | null;
  isActive?: boolean;
  priority?: number;
}

export function listAiSettings(userId: string) {
  return db.aiSetting.findMany({
    where: { userId },
    orderBy: { priority: "asc" },
  });
}

export function createAiSetting(userId: string, input: AiSettingInput) {
  return db.aiSetting.create({
    data: { ...input, userId },
  });
}

export async function updateAiSetting(
  userId: string,
  id: string,
  input: Partial<AiSettingInput>
) {
  await db.aiSetting.updateMany({ where: { id, userId }, data: input });
  return db.aiSetting.findFirst({ where: { id, userId } });
}

export function deleteAiSetting(userId: string, id: string) {
  return db.aiSetting.deleteMany({ where: { id, userId } });
}

export function activeProvidersByPriority(userId: string) {
  return db.aiSetting.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: "asc" },
  });
}
