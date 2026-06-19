export type Plan = "FREE" | "PRO";

export interface Entitlements {
  managedAi: boolean;
  advancedAnalytics: boolean;
  alwaysOnAutomation: boolean;
  maxJobs: number; // Infinity = unlimited
  maxCvs: number;
}

export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    managedAi: false,
    advancedAnalytics: false,
    alwaysOnAutomation: false,
    maxJobs: 50,
    maxCvs: 5,
  },
  PRO: {
    managedAi: true,
    advancedAnalytics: true,
    alwaysOnAutomation: true,
    maxJobs: Infinity,
    maxCvs: Infinity,
  },
};

/** Pro users with no own keys get managed AI only when the server has a key configured. */
export function shouldUseManagedAi(
  ent: Entitlements,
  hasOwnKeys: boolean,
  managedKeyConfigured: boolean
): boolean {
  return ent.managedAi && !hasOwnKeys && managedKeyConfigured;
}
