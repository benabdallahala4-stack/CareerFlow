import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createCv,
  listCvs,
  getCv,
  setDefaultCv,
  updateCv,
  deleteCv,
} from "@/services/cv-service";

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

beforeEach(ensureUser);

afterEach(async () => {
  await db.cv.deleteMany({ where: { label: { startsWith: "TEST_" } } });
});

describe("CvService", () => {
  it("creates and fetches a CV", async () => {
    const cv = await createCv({ label: "TEST_Backend v1", content: "resume text" });
    expect(cv.id).toBeTruthy();
    const fetched = await getCv(cv.id);
    expect(fetched?.content).toBe("resume text");
  });

  it("lists CVs", async () => {
    await createCv({ label: "TEST_A" });
    await createCv({ label: "TEST_B" });
    const list = await listCvs();
    expect(list.filter((c) => c.label.startsWith("TEST_")).length).toBe(2);
  });

  it("setDefaultCv makes exactly one default", async () => {
    const a = await createCv({ label: "TEST_Def_A", isDefault: true });
    const b = await createCv({ label: "TEST_Def_B" });
    await setDefaultCv(b.id);
    expect((await getCv(a.id))?.isDefault).toBe(false);
    expect((await getCv(b.id))?.isDefault).toBe(true);
  });

  it("updates content and deletes", async () => {
    const cv = await createCv({ label: "TEST_Upd" });
    const updated = await updateCv(cv.id, { content: "new text" });
    expect(updated.content).toBe("new text");
    await deleteCv(cv.id);
    expect(await getCv(cv.id)).toBeNull();
  });
});
