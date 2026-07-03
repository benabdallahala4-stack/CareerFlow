import Link from "next/link";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/auth-helpers";
import { computeStats, bestCvPerformance } from "@/services/stats-service";
import { computeNudges } from "@/services/nudge-service";
import { listUpcomingInterviews } from "@/services/interview-service";
import { listRecentJobs } from "@/services/job-service";
import { listPendingSuggestions } from "@/services/suggestion-service";
import { getEntitlements } from "@/services/plan-service";
import { fmtDate, fmtDateTime } from "@/lib/format";
import StatCard from "@/components/StatCard";
import PipelineBar from "@/components/PipelineBar";
import HomeNudges from "@/components/HomeNudges";
import HomeSuggestions from "@/components/HomeSuggestions";
import JobForm from "@/components/JobForm";
import { DEVMASTER_URL } from "@/lib/devmaster";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireUserId();
  const session = await auth();
  const name = session?.user?.name || "there";

  const [stats, nudges, upcoming, recent, suggestions, ent] = await Promise.all([
    computeStats(userId),
    computeNudges(userId),
    listUpcomingInterviews(userId, 5),
    listRecentJobs(userId, 6),
    listPendingSuggestions(userId),
    getEntitlements(userId),
  ]);
  const cvPerf = ent.advancedAnalytics ? await bestCvPerformance(userId) : [];

  const weekAhead = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const thisWeek = upcoming.filter(
    (iv) => iv.scheduledAt && new Date(iv.scheduledAt).getTime() <= weekAhead
  );

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Welcome back, <span className="brand-text">{name}</span>
      </h1>
      <p className="mt-0.5 text-sm text-zinc-500">Here&apos;s your job search at a glance.</p>

      <a
        href={`${DEVMASTER_URL}/interview`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 shadow-sm shadow-violet-600/20 transition hover:from-indigo-500 hover:to-violet-500"
      >
        <div>
          <h2 className="text-base font-semibold text-white">Prep for your interviews on DevMaster Hub</h2>
          <p className="mt-0.5 text-sm text-indigo-100">
            Mock interviews, 90+ deep-dive engineering topics, and coding challenges — sharpen up before the real thing.
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
          Start learning →
        </span>
      </a>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={stats.total} accent="indigo" />
        <StatCard label="Response rate" value={`${stats.responseRate}%`} accent="emerald" />
        <StatCard label="Offers" value={stats.offers} accent="violet" />
        <StatCard label="Interviews this week" value={stats.interviewsThisWeek} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <HomeSuggestions
            suggestions={suggestions.map((s) => ({
              id: s.id,
              classification: s.classification,
              proposedStatus: s.proposedStatus,
              fromEmail: s.fromEmail,
              subject: s.subject,
              jobId: s.jobId,
            }))}
          />
          <HomeNudges nudges={nudges} />

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">This week&apos;s interviews</h2>
            {thisWeek.length === 0 ? (
              <p className="text-sm text-zinc-400">No interviews in the next 7 days.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {thisWeek.map((iv) => (
                  <li key={iv.id}>
                    <Link href={`/jobs/${iv.job.id}`} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2 text-sm hover:bg-zinc-50">
                      <span className="font-medium text-zinc-700">{iv.job.title}</span>
                      <span className="text-zinc-500">{iv.type}</span>
                      <span className="ml-auto text-xs text-zinc-400">
                        {iv.scheduledAt ? fmtDateTime(iv.scheduledAt) : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <PipelineBar byStatus={stats.byStatus} />

          {ent.advancedAnalytics ? (
            <section className="card p-5">
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
            <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5 text-center shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-700">Advanced analytics</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
                See which CV gets you the most interviews, plus source and trend insights.
              </p>
              <Link href="/billing" className="btn-primary mt-3">
                Upgrade to Pro
              </Link>
            </section>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">Recent activity</h2>
            <ul className="flex flex-col gap-1.5">
              {recent.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50">
                    <span className="text-zinc-700">{j.title}</span>
                    <span className="text-xs text-zinc-400">{j.company?.name ?? ""}</span>
                    <span className="ml-auto text-xs text-zinc-300">
                      {fmtDate(j.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">Quick add a job</h2>
          <p className="mb-4 text-xs text-zinc-500">Starts in Wishlist.</p>
          <JobForm />
        </aside>
      </div>
    </main>
  );
}
