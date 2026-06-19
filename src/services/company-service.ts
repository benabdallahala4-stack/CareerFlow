import { db } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/constants";

export interface CompanyInput {
  name: string;
  website?: string | null;
  location?: string | null;
  notes?: string | null;
}

export function listCompanies() {
  return db.company.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { name: "asc" },
  });
}

export function getCompany(id: string) {
  return db.company.findFirst({ where: { id, userId: LOCAL_USER_ID } });
}

export function createCompany(input: CompanyInput) {
  return db.company.create({
    data: { ...input, userId: LOCAL_USER_ID },
  });
}

export function updateCompany(id: string, input: Partial<CompanyInput>) {
  return db.company.update({ where: { id }, data: input });
}

export function deleteCompany(id: string) {
  return db.company.delete({ where: { id } });
}
