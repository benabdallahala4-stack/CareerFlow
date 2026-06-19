import { NextResponse } from "next/server";
import { listNotifications, unreadCount } from "@/services/notification-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET() {
  const userId = await requireUserId();
  const [items, unread] = await Promise.all([
    listNotifications(userId, 30),
    unreadCount(userId),
  ]);
  return NextResponse.json({ items, unread });
}
