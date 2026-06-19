import { listJobs } from "@/services/job-service";
import KanbanBoard from "@/components/KanbanBoard";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await listJobs();
  const boardJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company ? { name: j.company.name } : null,
    location: j.location,
    status: j.status,
  }));

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold">CareerFlow OS</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <KanbanBoard initialJobs={boardJobs} />
        </section>
        <aside className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Add a job</h2>
          <JobForm />
        </aside>
      </div>
    </main>
  );
}
