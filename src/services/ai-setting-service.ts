import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import type { ProviderName } from "./ai/types";

export interface AiSettingInput {
  provider: ProviderName;
  apiKey?: string | null;
  model?: string | null;
  isActive?: boolean;
  priority?: number;
}

export function listAiSettings() {
  return db.aiSetting.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { priority: "asc" },
  });
}

export function createAiSetting(input: AiSettingInput) {
  return db.aiSetting.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateAiSetting(id: string, input: Partial<AiSettingInput>) {
  return db.aiSetting.update({ where: { id }, data: input });
}

export function deleteAiSetting(id: string) {
  return db.aiSetting.delete({ where: { id } });
}

export function activeProvidersByPriority() {
  return db.aiSetting.findMany({
    where: { userId: LOCAL_USER_ID, isActive: true },
    orderBy: { priority: "asc" },
  });
}
