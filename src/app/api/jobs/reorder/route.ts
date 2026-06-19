import { NextRequest, NextResponse } from "next/server";
import { reorderJobs } from "@/services/job-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  const { items } = await req.json();
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }
  await reorderJobs(userId, items);
  return NextResponse.json({ ok: true });
}
