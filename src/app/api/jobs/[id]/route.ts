import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob } from "@/services/job-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await getJob(params.id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  return NextResponse.json(await updateJob(params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteJob(params.id);
  return new NextResponse(null, { status: 204 });
}
