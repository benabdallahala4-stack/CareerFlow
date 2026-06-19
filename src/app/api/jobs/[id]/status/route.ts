import { NextRequest, NextResponse } from "next/server";
import { updateJobStatus } from "@/services/job-service";
import { JOB_STATUSES, type JobStatus } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  const status = body?.status as JobStatus;
  if (!JOB_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const boardOrder = typeof body?.boardOrder === "number" ? body.boardOrder : 0;
  return NextResponse.json(await updateJobStatus(userId, params.id, status, boardOrder));
}
