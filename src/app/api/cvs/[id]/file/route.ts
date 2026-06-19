import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getCv } from "@/services/cv-service";
import { requireUserId } from "@/lib/auth-helpers";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  const cv = await getCv(userId, params.id);
  if (!cv?.filePath) {
    return NextResponse.json({ error: "no file for this CV" }, { status: 404 });
  }

  // filePath is "uploads/<sanitized-name>" — keep it inside the uploads dir.
  const uploadsDir = path.join(process.cwd(), "uploads");
  const abs = path.join(process.cwd(), cv.filePath);
  if (!abs.startsWith(uploadsDir)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  try {
    const data = await readFile(abs);
    const ext = path.extname(cv.filePath).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(cv.filePath)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "file missing on disk" }, { status: 404 });
  }
}
