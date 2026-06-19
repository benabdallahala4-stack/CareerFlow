import { NextRequest, NextResponse } from "next/server";
import { markRead } from "@/services/notification-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await markRead(userId, params.id);
  return NextResponse.json({ ok: true });
}
