import { NextResponse } from "next/server";
import { markAllRead } from "@/services/notification-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST() {
  const userId = await requireUserId();
  await markAllRead(userId);
  return NextResponse.json({ ok: true });
}
