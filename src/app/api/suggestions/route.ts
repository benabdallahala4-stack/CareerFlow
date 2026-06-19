import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { listPendingSuggestions } from "@/services/suggestion-service";

export async function GET() {
  const userId = await requireUserId();
  return NextResponse.json(await listPendingSuggestions(userId));
}
