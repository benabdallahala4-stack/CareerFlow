import { NextRequest, NextResponse } from "next/server";
import { careerChat } from "@/services/ai/features";
import { listCvs } from "@/services/cv-service";
import { listJobs } from "@/services/job-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const { messages } = await req.json();
  const history = (messages ?? [])
    .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
    .join("\n");

  const cvs = await listCvs(userId);
  const jobs = await listJobs(userId);
  const defaultCv = cvs.find((c) => c.isDefault) ?? cvs[0];
  const context = `Default CV:\n${defaultCv?.content ?? "none"}\n\nApplications: ${jobs
    .map((j) => `${j.title} (${j.status})`)
    .join(", ")}`;

  const result = await careerChat(userId, history, context);
  return NextResponse.json(result);
}
