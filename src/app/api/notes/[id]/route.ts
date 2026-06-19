import { NextRequest, NextResponse } from "next/server";
import { deleteNote, updateNote } from "@/services/note-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const { body } = await req.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  return NextResponse.json(await updateNote(userId, params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteNote(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
