import { NextRequest, NextResponse } from "next/server";
import {
  getCompany,
  updateCompany,
  deleteCompany,
} from "@/services/company-service";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const company = await getCompany(userId, params.id);
  if (!company) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const body = await req.json();
  return NextResponse.json(await updateCompany(userId, params.id, body));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  await deleteCompany(userId, params.id);
  return new NextResponse(null, { status: 204 });
}
