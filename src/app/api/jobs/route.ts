import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/services/job-service";
import { findOrCreateCompany } from "@/services/company-service";
import { requireUserId } from "@/lib/auth-helpers";
import { withinLimit } from "@/services/plan-service";

export async function GET() {
  const userId = await requireUserId();
  return NextResponse.json(await listJobs(userId));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const body = await req.json();
  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!(await withinLimit(userId, "jobs"))) {
    return NextResponse.json(
      { error: "You've reached the free plan's job limit. Upgrade to Pro for unlimited.", upgrade: true },
      { status: 402 }
    );
  }
  const { companyName, ...rest } = body;
  if (companyName) {
    const c = await findOrCreateCompany(userId, companyName);
    rest.companyId = c.id;
  }
  const job = await createJob(userId, rest);
  return NextResponse.json(job, { status: 201 });
}
