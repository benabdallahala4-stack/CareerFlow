import { requireUserId } from "@/lib/auth-helpers";
import { getPlan } from "@/services/plan-service";
import { PLAN_ENTITLEMENTS } from "@/lib/entitlements";
import BillingActions from "@/components/BillingActions";

export const dynamic = "force-dynamic";

const ROWS: { label: string; free: string; pro: string }[] = [
  { label: "Job tracking, interviews, CVs, calendar", free: "✓", pro: "✓" },
  { label: "AI features with your own key", free: "✓", pro: "✓" },
  { label: "Tracked jobs", free: "Up to 50", pro: "Unlimited" },
  { label: "CV versions", free: "Up to 5", pro: "Unlimited" },
  { label: "Managed AI (no key needed)", free: "—", pro: "✓" },
  { label: "Advanced analytics", free: "—", pro: "✓" },
  { label: "Always-on automation", free: "Self-host", pro: "✓" },
];

export default async function BillingPage() {
  const userId = await requireUserId();
  const plan = await getPlan(userId);
  const ent = PLAN_ENTITLEMENTS[plan];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Billing</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            You&apos;re on the{" "}
            <span className={plan === "PRO" ? "font-medium text-indigo-600" : "font-medium text-zinc-700"}>
              {plan}
            </span>{" "}
            plan.
          </p>
        </div>
        <BillingActions plan={plan} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 font-medium">Free</th>
              <th className="px-4 py-3 font-medium text-indigo-600">Pro</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b border-zinc-50 last:border-0">
                <td className="px-4 py-3 text-zinc-700">{r.label}</td>
                <td className="px-4 py-3 text-zinc-500">{r.free}</td>
                <td className="px-4 py-3 text-zinc-700">{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-400">
        Payments aren&apos;t enabled yet — upgrading is simulated for now. Your current limits:{" "}
        {ent.maxJobs === Infinity ? "unlimited" : ent.maxJobs} jobs,{" "}
        {ent.maxCvs === Infinity ? "unlimited" : ent.maxCvs} CVs.
      </p>
    </main>
  );
}
