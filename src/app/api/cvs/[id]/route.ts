import { NextRequest, NextResponse } from "next/server";
import { updateCv, setDefaultCv, deleteCv } from "@/services/cv-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  if (body?.makeDefault === true) {
    return NextResponse.json(await setDefaultCv(userId, params.id));
  }
  const { label, content } = body ?? {};
  return NextResponse.json(await updateCv(userId, params.id, { label, content }));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteCv(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
