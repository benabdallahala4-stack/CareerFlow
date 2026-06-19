import { db } from "@/lib/db";

export interface CompanyInput {
  name: string;
  website?: string | null;
  location?: string | null;
  notes?: string | null;
  aiBrief?: string | null;
  aiBriefAt?: Date | null;
}

export function listCompanies(userId: string) {
  return db.company.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export function getCompany(userId: string, id: string) {
  return db.company.findFirst({ where: { id, userId } });
}

export function createCompany(userId: string, input: CompanyInput) {
  return db.company.create({
    data: { ...input, userId },
  });
}

export function updateCompany(userId: string, id: string, input: Partial<CompanyInput>) {
  return db.company.updateMany({ where: { id, userId }, data: input }).then(() =>
    db.company.findFirst({ where: { id, userId } })
  );
}

export function deleteCompany(userId: string, id: string) {
  return db.company.deleteMany({ where: { id, userId } });
}

export async function findOrCreateCompany(
  userId: string,
  name: string,
  website?: string | null
) {
  const trimmed = name.trim();
  const site = website?.trim() || null;
  const existing = await db.company.findFirst({
    where: { userId, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) {
    if (site && site !== existing.website) {
      return db.company.update({ where: { id: existing.id }, data: { website: site } });
    }
    return existing;
  }
  return db.company.create({ data: { userId, name: trimmed, website: site } });
}
