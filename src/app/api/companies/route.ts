import { NextRequest, NextResponse } from "next/server";
import { listCompanies, createCompany } from "@/services/company-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET() {
  const userId = await requireUserId();
  return NextResponse.json(await listCompanies(userId));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const body = await req.json();
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const company = await createCompany(userId, body);
  return NextResponse.json(company, { status: 201 });
}
