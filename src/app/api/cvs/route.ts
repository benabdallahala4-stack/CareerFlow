import { NextRequest, NextResponse } from "next/server";
import { listCvs, createCv } from "@/services/cv-service";
import { requireUserId } from "@/lib/auth-helpers";
import { withinLimit } from "@/services/plan-service";
import { saveCvFile } from "@/lib/cv-storage";

export async function GET() {
  const userId = await requireUserId();
  return NextResponse.json(await listCvs(userId));
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!(await withinLimit(userId, "cvs"))) {
      return NextResponse.json(
        { error: "You've reached the free plan's CV limit. Upgrade to Pro for unlimited.", upgrade: true },
        { status: 402 }
      );
    }
    const contentType = req.headers.get("content-type") ?? "";

    // JSON path: { label, content }
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (!body?.label) {
        return NextResponse.json({ error: "label is required" }, { status: 400 });
      }
      const cv = await createCv(userId, { label: body.label, content: body.content ?? null });
      return NextResponse.json(cv, { status: 201 });
    }

    // Multipart path: file upload
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const label =
      String(form.get("label") ?? "").trim() ||
      (file ? file.name.replace(/\.[^.]+$/, "") : "Untitled CV");

    let filePath: string | null = null;
    let content: string | null = null;

    if (file && file.size > 0) {
      const bytes = Buffer.from(await file.arrayBuffer());
      filePath = await saveCvFile(bytes, file.name, file.type);

      if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
        content = bytes.toString("utf-8");
      }
    }

    const cv = await createCv(userId, { label, filePath, content });
    return NextResponse.json(cv, { status: 201 });
  } catch (err) {
    console.error("[cv-upload] FAILED:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "upload failed" },
      { status: 500 }
    );
  }
}
