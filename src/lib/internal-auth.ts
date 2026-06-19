import { NextRequest } from "next/server";

/**
 * True when the request carries the correct internal secret header. Used to guard
 * machine-to-machine endpoints (cron / n8n) that have no logged-in session.
 */
export function checkInternalSecret(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = req.headers.get("x-internal-secret");
  return Boolean(secret) && provided === secret;
}
