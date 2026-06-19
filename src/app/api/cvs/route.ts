import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { listCvs, createCv } from "@/services/cv-service";

export async function GET() {
  return NextResponse.json(await listCvs());
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // JSON path: { label, content }
  if (contentType.includes("application/json")) {
    const body = await req.json();
    if (!body?.label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    const cv = await createCv({ label: body.label, content: body.content ?? null });
    return NextResponse.json(cv, { status: 201 });
  }

  // Multipart path: file upload
  const form = await req.formData();
  const label = String(form.get("label") ?? "").trim();
  const file = form.get("file") as File | null;
  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  let filePath: string | null = null;
  let content: string | null = null;

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(uploadsDir, safeName), bytes);
    filePath = `uploads/${safeName}`;

    // Auto-extract text only for plain-text files; PDFs/DOCX are pasted later.
    if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
      content = bytes.toString("utf-8");
    }
  }

  const cv = await createCv({ label, filePath, content });
  return NextResponse.json(cv, { status: 201 });
}
