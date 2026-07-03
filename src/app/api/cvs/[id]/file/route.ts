import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getCv } from "@/services/cv-service";
import { requireUserId } from "@/lib/auth-helpers";
import { isRemoteCvFile, readLocalCvFile } from "@/lib/cv-storage";

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

  // Remotely stored (Vercel Blob): ownership is verified above, so hand off to the Blob URL.
  if (isRemoteCvFile(cv.filePath)) {
    return NextResponse.redirect(cv.filePath);
  }

  try {
    const data = await readLocalCvFile(cv.filePath);
    const ext = path.extname(cv.filePath).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
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
