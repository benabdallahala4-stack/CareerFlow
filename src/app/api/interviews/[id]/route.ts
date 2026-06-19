import { NextRequest, NextResponse } from "next/server";
import { updateInterview, deleteInterview } from "@/services/interview-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  return NextResponse.json(await updateInterview(userId, params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteInterview(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
