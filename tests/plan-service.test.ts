import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import { getPlan, getEntitlements, setPlan, withinLimit } from "@/services/plan-service";
import { shouldUseManagedAi, PLAN_ENTITLEMENTS } from "@/lib/entitlements";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: { plan: "FREE", proSince: null },
    create: { id: U, email: "me@local", name: "Me" },
  });
}

beforeEach(async () => {
  await ensureUser();
  await db.cv.deleteMany({ where: { label: { startsWith: "TEST_PL_" } } });
});

afterEach(async () => {
  await db.cv.deleteMany({ where: { label: { startsWith: "TEST_PL_" } } });
  await db.user.update({ where: { id: U }, data: { plan: "FREE", proSince: null } });
});

describe("plan-service", () => {
  it("defaults to FREE and flips to PRO", async () => {
    expect(await getPlan(U)).toBe("FREE");
    await setPlan(U, "PRO");
    expect(await getPlan(U)).toBe("PRO");
    expect((await getEntitlements(U)).managedAi).toBe(true);
  });

  it("enforces the free CV cap boundary (5) and lifts it for PRO", async () => {
    for (let i = 0; i < 4; i++) {
      await db.cv.create({ data: { userId: U, label: `TEST_PL_${i}` } });
    }
    expect(await withinLimit(U, "cvs")).toBe(true); // 4 < 5
    await db.cv.create({ data: { userId: U, label: "TEST_PL_5" } });
    expect(await withinLimit(U, "cvs")).toBe(false); // 5 >= 5

    await setPlan(U, "PRO");
    expect(await withinLimit(U, "cvs")).toBe(true); // unlimited
  });

  it("shouldUseManagedAi truth table", () => {
    const free = PLAN_ENTITLEMENTS.FREE;
    const pro = PLAN_ENTITLEMENTS.PRO;
    expect(shouldUseManagedAi(pro, false, true)).toBe(true);   // pro, no own key, managed configured
    expect(shouldUseManagedAi(pro, true, true)).toBe(false);   // has own key
    expect(shouldUseManagedAi(pro, false, false)).toBe(false); // managed not configured
    expect(shouldUseManagedAi(free, false, true)).toBe(false); // free plan
  });
});
