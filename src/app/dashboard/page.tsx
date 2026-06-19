import { computeStats } from "@/services/stats-service";
import StatCard from "@/components/StatCard";
import PipelineBar from "@/components/PipelineBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await computeStats();

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={stats.total} />
        <StatCard
          label="Response rate"
          value={`${stats.responseRate}%`}
          hint="interview or offer ÷ applied"
        />
        <StatCard label="Offers" value={stats.offers} />
        <StatCard
          label="Interviews this week"
          value={stats.interviewsThisWeek}
          hint="next 7 days"
        />
      </div>

      <div className="mt-6">
        <PipelineBar byStatus={stats.byStatus} />
      </div>
    </main>
  );
}
