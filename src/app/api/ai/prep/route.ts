import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCv } from "@/services/cv-service";
import { interviewPrep } from "@/services/ai/features";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const { jobId, interviewType } = await req.json();
  const job = await getJob(userId, jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  const cv = job.cvId ? await getCv(userId, job.cvId) : null;
  const result = await interviewPrep(userId, job.title, cv?.content ?? "", interviewType ?? "PHONE");
  return NextResponse.json(result);
}
