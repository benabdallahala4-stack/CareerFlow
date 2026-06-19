import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/services/job-service";
import { requireUserId } from "@/lib/auth-helpers";

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
  const job = await createJob(userId, body);
  return NextResponse.json(job, { status: 201 });
}
