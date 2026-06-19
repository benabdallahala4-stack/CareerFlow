import { NextRequest, NextResponse } from "next/server";
import { listNotesForJob, createNoteForJob } from "@/services/note-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  return NextResponse.json(await listNotesForJob(userId, params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  if (!body?.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  const note = await createNoteForJob(userId, params.id, body.body);
  return NextResponse.json(note, { status: 201 });
}
