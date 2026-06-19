import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { applySuggestion } from "@/services/suggestion-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const s = await applySuggestion(userId, params.id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
