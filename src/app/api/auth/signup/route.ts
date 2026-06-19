import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  const e = String(email ?? "").toLowerCase().trim();
  if (!e || !password || String(password).length < 6) {
    return NextResponse.json(
      { error: "email and 6+ char password required" },
      { status: 400 }
    );
  }
  const existing = await db.user.findUnique({ where: { email: e } });
  if (existing) {
    return NextResponse.json({ error: "email already registered" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  await db.user.create({ data: { email: e, name: name || null, passwordHash } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
