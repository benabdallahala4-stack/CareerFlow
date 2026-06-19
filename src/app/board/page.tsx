import { listJobs } from "@/services/job-service";
import KanbanBoard from "@/components/KanbanBoard";
import AddJobButton from "@/components/AddJobButton";
import { BOARD_COLUMNS } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const userId = await requireUserId();
  const jobs = await listJobs(userId);
  const boardJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company ? { name: j.company.name } : null,
    location: j.location,
    status: j.status,
  }));

  const activeCount = boardJobs.filter((j) =>
    BOARD_COLUMNS.includes(j.status as (typeof BOARD_COLUMNS)[number])
  ).length;

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Job Board</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {activeCount} {activeCount === 1 ? "application" : "applications"} in your pipeline
          </p>
        </div>
        <AddJobButton />
      </div>

      <KanbanBoard
        key={boardJobs.map((j) => j.id).sort().join(",")}
        initialJobs={boardJobs}
      />
    </main>
  );
}
