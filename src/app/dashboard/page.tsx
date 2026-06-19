import Link from "next/link";
import { computeStats, bestCvPerformance } from "@/services/stats-service";
import { getEntitlements } from "@/services/plan-service";
import StatCard from "@/components/StatCard";
import PipelineBar from "@/components/PipelineBar";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [stats, ent] = await Promise.all([computeStats(userId), getEntitlements(userId)]);
  const cvPerf = ent.advancedAnalytics ? await bestCvPerformance(userId) : [];

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={stats.total} />
        <StatCard label="Response rate" value={`${stats.responseRate}%`} hint="interview or offer ÷ applied" />
        <StatCard label="Offers" value={stats.offers} />
        <StatCard label="Interviews this week" value={stats.interviewsThisWeek} hint="next 7 days" />
      </div>

      <div className="mt-6">
        <PipelineBar byStatus={stats.byStatus} />
      </div>

      <div className="mt-6">
        {ent.advancedAnalytics ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">
              CV performance <span className="text-xs font-normal text-indigo-500">Pro</span>
            </h2>
            {cvPerf.length === 0 ? (
              <p className="text-sm text-zinc-400">Tag CVs to jobs to see which performs best.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cvPerf.map((c) => (
                  <li key={c.label} className="flex items-center gap-3 text-sm">
                    <span className="w-40 truncate text-zinc-700">{c.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.rate}%` }} />
                    </div>
                    <span className="w-28 text-right text-xs text-zinc-500">
                      {c.rate}% · {c.responded}/{c.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-5 text-center shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-700">Advanced analytics</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              See which CV gets you the most interviews, plus source and trend insights.
            </p>
            <Link
              href="/billing"
              className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Upgrade to Pro
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
