import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-service";
import { getCv } from "@/services/cv-service";
import { matchScore } from "@/services/ai/features";

export async function POST(req: NextRequest) {
  const { jobId } = await req.json();
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  const cv = job.cvId ? await getCv(job.cvId) : null;
  const cvText = cv?.content ?? "";
  const jd = `${job.title}\n${job.description ?? ""}`;
  const result = await matchScore(cvText, jd);
  return NextResponse.json(result);
}
