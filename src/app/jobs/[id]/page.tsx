import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/services/job-service";
import JobForm from "@/components/JobForm";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function JobDetail({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-indigo-600"
      >
        ← Back to board
      </Link>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {job.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {job.company?.name ?? "No company"}
              {job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Salary
            </dt>
            <dd className="mt-1 text-zinc-700">{job.salary || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Applied
            </dt>
            <dd className="mt-1 text-zinc-700">
              {job.appliedAt
                ? new Date(job.appliedAt).toLocaleDateString()
                : "—"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Posting
            </dt>
            <dd className="mt-1">
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {job.url}
                </a>
              ) : (
                <span className="text-zinc-700">—</span>
              )}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-700">
              {job.description || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-800">Edit job</h2>
        <JobForm
          initial={{
            id: job.id,
            title: job.title,
            url: job.url ?? "",
            salary: job.salary ?? "",
            location: job.location ?? "",
            description: job.description ?? "",
          }}
        />
      </section>
    </main>
  );
}
