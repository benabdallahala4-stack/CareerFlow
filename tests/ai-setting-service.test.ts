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

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  await db.aiSetting.deleteMany({ where: { userId: LOCAL_USER_ID } });
});

afterEach(async () => {
  await db.aiSetting.deleteMany({ where: { userId: LOCAL_USER_ID } });
});

describe("AiSettingService", () => {
  it("creates and lists provider settings", async () => {
    await createAiSetting({ provider: "GROQ", apiKey: "k1", priority: 1 });
    const list = await listAiSettings();
    expect(list.length).toBe(1);
    expect(list[0].provider).toBe("GROQ");
  });

  it("returns active providers sorted by priority asc", async () => {
    await createAiSetting({ provider: "OPENAI", apiKey: "k2", priority: 2 });
    await createAiSetting({ provider: "GROQ", apiKey: "k1", priority: 1 });
    await createAiSetting({ provider: "GEMINI", apiKey: "k3", priority: 3, isActive: false });
    const active = await activeProvidersByPriority();
    expect(active.map((a) => a.provider)).toEqual(["GROQ", "OPENAI"]);
  });

  it("updates and deletes", async () => {
    const s = await createAiSetting({ provider: "CLAUDE", apiKey: "k" });
    const upd = await updateAiSetting(s.id, { isActive: false });
    expect(upd.isActive).toBe(false);
    await deleteAiSetting(s.id);
    expect((await listAiSettings()).length).toBe(0);
  });
});
