import { NextRequest, NextResponse } from "next/server";
import { checkInternalSecret } from "@/lib/internal-auth";
import { generateForAllUsers } from "@/services/notification-generator";

export async function POST(req: NextRequest) {
  if (!checkInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const created = await generateForAllUsers(new Date());
  return NextResponse.json({ created });
}
