import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";
import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from "@/services/company-service";

const U = LOCAL_USER_ID;

async function ensureUser() {
  await db.user.upsert({
    where: { id: U },
    update: {},
    create: { id: U, email: "me@local", name: "Me" },
  });
}

afterEach(async () => {
  await db.company.deleteMany({ where: { name: { startsWith: "TEST_" } } });
});

describe("CompanyService", () => {
  it("creates and fetches a company", async () => {
    await ensureUser();
    const created = await createCompany(U, { name: "TEST_Acme", location: "Remote" });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("TEST_Acme");

    const fetched = await getCompany(U, created.id);
    expect(fetched?.location).toBe("Remote");
  });

  it("lists, updates and deletes", async () => {
    await ensureUser();
    const c = await createCompany(U, { name: "TEST_Beta" });
    const list = await listCompanies(U);
    expect(list.some((x) => x.id === c.id)).toBe(true);

    const updated = await updateCompany(U, c.id, { website: "https://beta.test" });
    expect(updated?.website).toBe("https://beta.test");

    await deleteCompany(U, c.id);
    expect(await getCompany(U, c.id)).toBeNull();
  });
});
