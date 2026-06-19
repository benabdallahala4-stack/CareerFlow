import { NextRequest, NextResponse } from "next/server";
import { listCompanies, createCompany } from "@/services/company-service";

export async function GET() {
  return NextResponse.json(await listCompanies());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const company = await createCompany(body);
  return NextResponse.json(company, { status: 201 });
}
