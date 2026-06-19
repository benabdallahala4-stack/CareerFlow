import { NextRequest, NextResponse } from "next/server";
import { updateAiSetting, deleteAiSetting } from "@/services/ai-setting-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
  if (typeof body.priority === "number") allowed.priority = body.priority;
  if (typeof body.model === "string") allowed.model = body.model;
  if (typeof body.apiKey === "string") allowed.apiKey = body.apiKey;
  await updateAiSetting(userId, params.id, allowed);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteAiSetting(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
