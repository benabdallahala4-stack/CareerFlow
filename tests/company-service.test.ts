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

async function ensureUser() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
  });
}

afterEach(async () => {
  await db.company.deleteMany({ where: { name: { startsWith: "TEST_" } } });
});

describe("CompanyService", () => {
  it("creates and fetches a company", async () => {
    await ensureUser();
    const created = await createCompany({ name: "TEST_Acme", location: "Remote" });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("TEST_Acme");

    const fetched = await getCompany(created.id);
    expect(fetched?.location).toBe("Remote");
  });

  it("lists, updates and deletes", async () => {
    await ensureUser();
    const c = await createCompany({ name: "TEST_Beta" });
    const list = await listCompanies();
    expect(list.some((x) => x.id === c.id)).toBe(true);

    const updated = await updateCompany(c.id, { website: "https://beta.test" });
    expect(updated.website).toBe("https://beta.test");

    await deleteCompany(c.id);
    expect(await getCompany(c.id)).toBeNull();
  });
});
