// CV file storage that works both locally and on serverless hosts.
//
// Vercel's runtime filesystem is read-only/ephemeral, so on Vercel we store CV files in
// Vercel Blob (free tier). Locally — or on any host with a writable disk — we fall back to
// the `uploads/` directory. The mode is chosen automatically by whether Blob is configured.
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

function safeFileName(originalName: string): string {
  return `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

/**
 * Persist an uploaded CV. Returns the value to store in `Cv.filePath`:
 *  - Blob mode: an absolute `https://…` URL
 *  - Local mode: a repo-relative `uploads/<name>` path
 */
export async function saveCvFile(
  bytes: Buffer,
  originalName: string,
  contentType?: string
): Promise<string> {
  const name = safeFileName(originalName);

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`cvs/${name}`, bytes, {
      access: "public",
      contentType: contentType || undefined,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), bytes);
  return `uploads/${name}`;
}

/** True when a stored filePath points at remote Blob storage rather than local disk. */
export function isRemoteCvFile(filePath: string): boolean {
  return /^https?:\/\//i.test(filePath);
}

/** Read a locally-stored CV file, guarding against path traversal outside `uploads/`. */
export async function readLocalCvFile(filePath: string): Promise<Buffer> {
  const uploadsDir = path.join(process.cwd(), "uploads");
  const abs = path.join(process.cwd(), filePath);
  if (!abs.startsWith(uploadsDir)) {
    throw new Error("invalid path");
  }
  return readFile(abs);
}
