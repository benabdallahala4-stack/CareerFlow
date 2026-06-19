import { NextRequest, NextResponse } from "next/server";
import { updateCv, setDefaultCv, deleteCv } from "@/services/cv-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  if (body?.makeDefault === true) {
    return NextResponse.json(await setDefaultCv(params.id));
  }
  const { label, content } = body ?? {};
  return NextResponse.json(await updateCv(params.id, { label, content }));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteCv(params.id);
  return new NextResponse(null, { status: 204 });
}
