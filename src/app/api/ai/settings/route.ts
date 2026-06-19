import { NextRequest, NextResponse } from "next/server";
import { listAiSettings, createAiSetting } from "@/services/ai-setting-service";
import { PROVIDERS, type ProviderName } from "@/services/ai/types";

export async function GET() {
  const settings = await listAiSettings();
  // Do not leak full keys to the client.
  return NextResponse.json(
    settings.map((s) => ({
      id: s.id,
      provider: s.provider,
      model: s.model,
      isActive: s.isActive,
      priority: s.priority,
      hasKey: Boolean(s.apiKey),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!PROVIDERS.includes(body?.provider)) {
    return NextResponse.json({ error: "valid provider required" }, { status: 400 });
  }
  const created = await createAiSetting({
    provider: body.provider as ProviderName,
    apiKey: body.apiKey ?? null,
    model: body.model ?? null,
    priority: typeof body.priority === "number" ? body.priority : 0,
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
