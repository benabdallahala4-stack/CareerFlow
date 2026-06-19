import { NextRequest, NextResponse } from "next/server";
import {
  getCompany,
  updateCompany,
  deleteCompany,
} from "@/services/company-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const company = await getCompany(params.id);
  if (!company) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  return NextResponse.json(await updateCompany(params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteCompany(params.id);
  return new NextResponse(null, { status: 204 });
}
