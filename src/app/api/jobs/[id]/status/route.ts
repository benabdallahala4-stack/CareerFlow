import { NextRequest, NextResponse } from "next/server";
import { updateJobStatus } from "@/services/job-service";
import { JOB_STATUSES, type JobStatus } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const status = body?.status as JobStatus;
  if (!JOB_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const boardOrder = typeof body?.boardOrder === "number" ? body.boardOrder : 0;
  return NextResponse.json(await updateJobStatus(params.id, status, boardOrder));
}
