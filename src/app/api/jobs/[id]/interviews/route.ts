import { NextRequest, NextResponse } from "next/server";
import {
  listInterviewsForJob,
  createInterview,
} from "@/services/interview-service";
import { INTERVIEW_TYPES, type InterviewType } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  return NextResponse.json(await listInterviewsForJob(userId, params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  if (!INTERVIEW_TYPES.includes(body?.type)) {
    return NextResponse.json({ error: "valid type required" }, { status: 400 });
  }
  const iv = await createInterview(userId, params.id, body as { type: InterviewType });
  return NextResponse.json(iv, { status: 201 });
}
