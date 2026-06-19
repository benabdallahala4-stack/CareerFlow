import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob } from "@/services/job-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const job = await getJob(userId, params.id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  return NextResponse.json(await updateJob(userId, params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteJob(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
