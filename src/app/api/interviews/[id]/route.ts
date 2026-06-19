import { NextRequest, NextResponse } from "next/server";
import { updateInterview, deleteInterview } from "@/services/interview-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  return NextResponse.json(await updateInterview(params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteInterview(params.id);
  return new NextResponse(null, { status: 204 });
}
