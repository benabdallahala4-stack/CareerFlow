import { NextRequest, NextResponse } from "next/server";
import { listNotesForJob, createNoteForJob } from "@/services/note-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(await listNotesForJob(params.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  if (!body?.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  const note = await createNoteForJob(params.id, body.body);
  return NextResponse.json(note, { status: 201 });
}
