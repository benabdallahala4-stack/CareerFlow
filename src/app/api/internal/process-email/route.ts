import { NextRequest, NextResponse } from "next/server";
import { checkInternalSecret } from "@/lib/internal-auth";
import { processIncomingEmail } from "@/services/email/process";

export async function POST(req: NextRequest) {
  if (!checkInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body?.userId || !body?.from) {
    return NextResponse.json({ error: "userId and from required" }, { status: 400 });
  }
  const result = await processIncomingEmail(body.userId, {
    from: body.from,
    subject: body.subject ?? "",
    body: body.body ?? "",
  });
  return NextResponse.json(result);
}
