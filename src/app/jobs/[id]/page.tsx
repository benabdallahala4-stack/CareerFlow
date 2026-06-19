import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/services/job-service";
import JobForm from "@/components/JobForm";

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
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to board
      </Link>

      <h1 className="mt-3 text-2xl font-bold">{job.title}</h1>
      <p className="text-gray-500">
        {job.company?.name ?? "No company"}
        {job.location ? ` · ${job.location}` : ""}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd>{job.status}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Salary</dt>
          <dd>{job.salary ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Posting</dt>
          <dd>
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {job.url}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Description</dt>
          <dd className="whitespace-pre-wrap">{job.description ?? "—"}</dd>
        </div>
      </dl>

      <section className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Edit job</h2>
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
