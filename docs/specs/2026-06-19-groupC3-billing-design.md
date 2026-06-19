# CareerFlow OS — Group C.3: Billing — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorming)
**Scope:** Final Group C subsystem (Notifications ✅ → n8n ✅ → Billing).

## Goal

A Pro-subscription mechanism with free-vs-pro entitlements, ready to monetize *other* users —
without charging anyone yet. Stripe is **not** integrated; an "Upgrade" button flips the plan
(simulated) at the exact seam where Stripe Checkout will later drop in. The **free core stays
fully usable**; Pro only adds conveniences.

## Decisions

- Flat **Pro** subscription (FREE | PRO).
- Pro unlocks: **managed AI** (no own key), **advanced analytics**, **higher limits**, and
  **always-on automation** (flagged, not hard-enforced — see below).
- **Scaffold only, no Stripe.** `/api/billing/checkout` flips the plan now; real Stripe later.
- Free caps: **50 jobs, 5 CVs** (generous; demonstrates gating, never bites normal use).
- Automation endpoints stay **open** (secret-guarded) so self-hosting keeps working; plan-gating
  automation is a documented hosted-SaaS concern, not enforced here.

---

## Data model

`User`: add `plan String @default("FREE")` and `proSince DateTime?`.

## Entitlements (single source of truth)

`src/lib/entitlements.ts`:
```ts
export type Plan = "FREE" | "PRO";
export interface Entitlements {
  managedAi: boolean;
  advancedAnalytics: boolean;
  alwaysOnAutomation: boolean;
  maxJobs: number;   // Infinity = unlimited
  maxCvs: number;
}
export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: { managedAi:false, advancedAnalytics:false, alwaysOnAutomation:false, maxJobs:50, maxCvs:5 },
  PRO:  { managedAi:true,  advancedAnalytics:true,  alwaysOnAutomation:true,  maxJobs:Infinity, maxCvs:Infinity },
};
export function shouldUseManagedAi(ent: Entitlements, hasOwnKeys: boolean, managedKeyConfigured: boolean): boolean {
  return ent.managedAi && !hasOwnKeys && managedKeyConfigured;
}
```

## Plan service (TDD)

`src/services/plan-service.ts`:
- `getPlan(userId): Promise<Plan>`, `getEntitlements(userId)`, `setPlan(userId, plan)` (sets
  `proSince` when upgrading), `withinLimit(userId, "jobs"|"cvs"): Promise<boolean>` (count < cap).

## Gating

- **Limits:** `POST /api/jobs` and `POST /api/cvs` call `withinLimit` first; on cap →
  `402 { error, upgrade:true }`. UI shows the message.
- **Managed AI:** `src/services/ai/router.ts` — after building adapters from the user's own keys,
  if none AND `shouldUseManagedAi(getEntitlements(userId), false, !!env.MANAGED_AI_KEY)`, append a
  managed adapter from `buildAdapter(env.MANAGED_AI_PROVIDER, env.MANAGED_AI_KEY, env.MANAGED_AI_MODEL)`.
  If env unset, Pro falls back exactly like free (no crash). Free users unchanged.
- **Advanced analytics:** dashboard gains a section; PRO sees a "best-performing CV" insight
  (`bestCvPerformance(userId)` in stats-service), FREE sees a locked card with an upgrade CTA.

## API + pages

- `POST /api/billing/checkout` (session) — body `{ plan }`; calls `setPlan`; returns `{ ok, plan }`.
  *(Seam for Stripe Checkout — replace the body with a redirect to a Stripe session later.)*
- `src/app/billing/page.tsx` — current plan, Free-vs-Pro table, Upgrade/Downgrade button
  (`BillingActions.tsx`, client).
- Header: Pro badge for PRO; "Upgrade" link for FREE; `/billing` reachable.

## Env

`MANAGED_AI_PROVIDER`, `MANAGED_AI_KEY`, `MANAGED_AI_MODEL` (optional; only used to serve Pro
managed AI). Documented; unset by default so nothing changes locally.

## Testing

- **TDD:** `PLAN_ENTITLEMENTS` shape; `setPlan` then `getEntitlements` reflects PRO; `withinLimit`
  boundary (at cap → false); `shouldUseManagedAi` truth table.
- **Build** typechecks routes/pages.
- **Live smoke:** login → `/billing` 200; POST checkout {plan:"PRO"} → plan flips; dashboard advanced
  section unlocks; job-limit path returns 402 when forced (cap lowered in a scratch check or asserted via unit).

## Out of scope

Real Stripe (Checkout/webhooks/customer portal), proration, invoices, team/seat billing, metered
credits, hard-enforcing automation by plan.

## Next

writing-plans → implement. This completes Group C and the planned roadmap; remaining future work
(real Stripe, email/push channels, Google OAuth, mobile) is deploy-/demand-gated.
