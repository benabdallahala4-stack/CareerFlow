import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { setPlan } from "@/services/plan-service";
import type { Plan } from "@/lib/entitlements";

/**
 * Simulated checkout. For now this just flips the user's plan. This is the seam
 * where real Stripe Checkout will go later: create a Checkout Session and return
 * its URL instead of flipping the plan directly (the webhook would set the plan).
 */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const { plan } = await req.json();
  if (plan !== "FREE" && plan !== "PRO") {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }
  await setPlan(userId, plan as Plan);
  return NextResponse.json({ ok: true, plan });
}
