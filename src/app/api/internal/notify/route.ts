import { NextRequest, NextResponse } from "next/server";
import { checkInternalSecret } from "@/lib/internal-auth";
import { createNotification, type NotificationKind } from "@/services/notification-service";

export async function POST(req: NextRequest) {
  if (!checkInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body?.userId || !body?.title) {
    return NextResponse.json({ error: "userId and title required" }, { status: 400 });
  }
  const n = await createNotification(body.userId, {
    kind: (body.kind as NotificationKind) ?? "GENERIC",
    title: body.title,
    body: body.body ?? null,
    jobId: body.jobId ?? null,
    dedupeKey: body.dedupeKey ?? null,
  });
  return NextResponse.json({ id: n.id }, { status: 201 });
}
