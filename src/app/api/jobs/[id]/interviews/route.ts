import { NextRequest, NextResponse } from "next/server";
import {
  listInterviewsForJob,
  createInterview,
} from "@/services/interview-service";
import { INTERVIEW_TYPES, type InterviewType } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(await listInterviewsForJob(params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  if (!INTERVIEW_TYPES.includes(body?.type)) {
    return NextResponse.json({ error: "valid type required" }, { status: 400 });
  }
  const iv = await createInterview(params.id, body as { type: InterviewType });
  return NextResponse.json(iv, { status: 201 });
}
