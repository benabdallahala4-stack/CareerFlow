import { NextRequest, NextResponse } from "next/server";
import { deleteNote } from "@/services/note-service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteNote(params.id);
  return new NextResponse(null, { status: 204 });
}
