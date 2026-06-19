import { db } from "@/lib/db";
import { PLAN_ENTITLEMENTS, type Plan, type Entitlements } from "@/lib/entitlements";

export async function getPlan(userId: string): Promise<Plan> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return (user?.plan as Plan) ?? "FREE";
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  return PLAN_ENTITLEMENTS[await getPlan(userId)];
}

export async function setPlan(userId: string, plan: Plan) {
  return db.user.update({
    where: { id: userId },
    data: { plan, proSince: plan === "PRO" ? new Date() : null },
  });
}

export async function withinLimit(userId: string, kind: "jobs" | "cvs"): Promise<boolean> {
  const ent = await getEntitlements(userId);
  if (kind === "jobs") {
    if (ent.maxJobs === Infinity) return true;
    return (await db.job.count({ where: { userId } })) < ent.maxJobs;
  }
  if (ent.maxCvs === Infinity) return true;
  return (await db.cv.count({ where: { userId } })) < ent.maxCvs;
}
