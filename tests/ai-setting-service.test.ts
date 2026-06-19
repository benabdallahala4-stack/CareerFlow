import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  listAiSettings,
  createAiSetting,
  updateAiSetting,
  deleteAiSetting,
  activeProvidersByPriority,
} from "@/services/ai-setting-service";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  await db.aiSetting.deleteMany({ where: { userId: U } });
});

afterEach(async () => {
  await db.aiSetting.deleteMany({ where: { userId: U } });
});

describe("AiSettingService", () => {
  it("creates and lists provider settings", async () => {
    await createAiSetting(U, { provider: "GROQ", apiKey: "k1", priority: 1 });
    const list = await listAiSettings(U);
    expect(list.length).toBe(1);
    expect(list[0].provider).toBe("GROQ");
  });

  it("returns active providers sorted by priority asc", async () => {
    await createAiSetting(U, { provider: "OPENAI", apiKey: "k2", priority: 2 });
    await createAiSetting(U, { provider: "GROQ", apiKey: "k1", priority: 1 });
    await createAiSetting(U, { provider: "GEMINI", apiKey: "k3", priority: 3, isActive: false });
    const active = await activeProvidersByPriority(U);
    expect(active.map((a) => a.provider)).toEqual(["GROQ", "OPENAI"]);
  });

  it("updates and deletes", async () => {
    const s = await createAiSetting(U, { provider: "CLAUDE", apiKey: "k" });
    const upd = await updateAiSetting(U, s.id, { isActive: false });
    expect(upd?.isActive).toBe(false);
    await deleteAiSetting(U, s.id);
    expect((await listAiSettings(U)).length).toBe(0);
  });
});
