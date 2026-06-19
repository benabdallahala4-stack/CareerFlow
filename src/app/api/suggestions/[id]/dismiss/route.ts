import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { dismissSuggestion } from "@/services/suggestion-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await dismissSuggestion(userId, params.id);
  return NextResponse.json({ ok: true });
}
