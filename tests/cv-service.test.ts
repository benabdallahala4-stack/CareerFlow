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

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

beforeEach(ensureUser);

afterEach(async () => {
  await db.cv.deleteMany({ where: { label: { startsWith: "TEST_" } } });
});

describe("CvService", () => {
  it("creates and fetches a CV", async () => {
    const cv = await createCv(U, { label: "TEST_Backend v1", content: "resume text" });
    expect(cv.id).toBeTruthy();
    const fetched = await getCv(U, cv.id);
    expect(fetched?.content).toBe("resume text");
  });

  it("lists CVs", async () => {
    await createCv(U, { label: "TEST_A" });
    await createCv(U, { label: "TEST_B" });
    const list = await listCvs(U);
    expect(list.filter((c) => c.label.startsWith("TEST_")).length).toBe(2);
  });

  it("setDefaultCv makes exactly one default", async () => {
    const a = await createCv(U, { label: "TEST_Def_A", isDefault: true });
    const b = await createCv(U, { label: "TEST_Def_B" });
    await setDefaultCv(U, b.id);
    expect((await getCv(U, a.id))?.isDefault).toBe(false);
    expect((await getCv(U, b.id))?.isDefault).toBe(true);
  });

  it("updates content and deletes", async () => {
    const cv = await createCv(U, { label: "TEST_Upd" });
    const updated = await updateCv(U, cv.id, { content: "new text" });
    expect(updated?.content).toBe("new text");
    await deleteCv(U, cv.id);
    expect(await getCv(U, cv.id)).toBeNull();
  });
});
