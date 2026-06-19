import { NextRequest, NextResponse } from "next/server";
import { deleteNote } from "@/services/note-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteNote(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
