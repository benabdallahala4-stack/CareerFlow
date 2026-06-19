import { db } from "@/lib/db";

function domainOf(email: string): string | null {
  const m = email.toLowerCase().match(/@([^>\s]+)/);
  return m ? m[1].replace(/[>\s]+$/, "") : null;
}

function hostOf(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function rootName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|gmbh|company)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Find the best job for an incoming email: by the sender's domain matching a
 * company's website, or the company name appearing in the subject/body.
 */
export async function matchJobForEmail(
  userId: string,
  from: string,
  subject: string,
  body: string
): Promise<string | null> {
  const jobs = await db.job.findMany({
    where: { userId, companyId: { not: null } },
    include: { company: true },
    orderBy: { updatedAt: "desc" },
  });
  if (jobs.length === 0) return null;

  const domain = domainOf(from);
  const text = `${subject}\n${body}`.toLowerCase();

  for (const j of jobs) {
    const c = j.company;
    if (!c) continue;
    const token = rootName(c.name);

    if (domain && c.website) {
      const host = hostOf(c.website);
      if (host && (host === domain || domain.endsWith(host) || host.endsWith(domain))) {
        return j.id;
      }
    }
    if (domain && token.length > 2 && domain.includes(token)) return j.id;
    if (text.includes(c.name.toLowerCase())) return j.id;
  }
  return null;
}
