import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCompany, updateCompany } from "@/services/company-service";
import { companyBrief } from "@/services/ai/features";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const { jobId, refresh } = await req.json();
  const job = await getJob(userId, jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  if (!job.companyId) {
    return NextResponse.json({ error: "add a company to this job first" }, { status: 400 });
  }
  const company = await getCompany(userId, job.companyId);
  if (!company) return NextResponse.json({ error: "company not found" }, { status: 404 });

  if (company.aiBrief && !refresh) {
    return NextResponse.json({
      text: company.aiBrief,
      usedFallback: false,
      cachedAt: company.aiBriefAt,
    });
  }

  const result = await companyBrief(userId, company.name, company.website ?? null, job.title);
  await updateCompany(userId, company.id, {
    aiBrief: result.text,
    aiBriefAt: new Date(),
  });
  return NextResponse.json({ ...result, cachedAt: new Date() });
}
