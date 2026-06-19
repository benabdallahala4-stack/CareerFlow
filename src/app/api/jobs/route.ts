import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/services/job-service";

export async function GET() {
  return NextResponse.json(await listJobs());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const job = await createJob(body);
  return NextResponse.json(job, { status: 201 });
}
