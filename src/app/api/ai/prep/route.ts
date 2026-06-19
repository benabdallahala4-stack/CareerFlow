import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCv } from "@/services/cv-service";
import { interviewPrep } from "@/services/ai/features";

export async function POST(req: NextRequest) {
  const { jobId, interviewType } = await req.json();
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  const cv = job.cvId ? await getCv(job.cvId) : null;
  const result = await interviewPrep(job.title, cv?.content ?? "", interviewType ?? "PHONE");
  return NextResponse.json(result);
}
