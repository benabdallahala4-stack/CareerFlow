import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/services/job-service";
import { listCvs } from "@/services/cv-service";
import JobForm from "@/components/JobForm";
import StatusBadge from "@/components/StatusBadge";
import CvPicker from "@/components/CvPicker";
import InterviewSection from "@/components/InterviewSection";
import NoteSection from "@/components/NoteSection";
import MatchScorePanel from "@/components/MatchScorePanel";
import TailorPanel from "@/components/TailorPanel";
import StageStepper from "@/components/StageStepper";
import CompanyResearchPanel from "@/components/CompanyResearchPanel";
import { requireUserId } from "@/lib/auth-helpers";
import { formatSalary } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import DeleteJobButton from "@/components/DeleteJobButton";
import ArchiveJobButton from "@/components/ArchiveJobButton";

export const dynamic = "force-dynamic";

export default async function JobDetail({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireUserId();
  const job = await getJob(userId, params.id);
  if (!job) notFound();

  const cvs = await listCvs(userId);

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
            <dd className="mt-1 text-zinc-700">
              {formatSalary(job.salaryAmount, job.salaryCurrency, job.salaryPeriod, job.salary) || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Applied
            </dt>
            <dd className="mt-1 text-zinc-700">
              {job.appliedAt
                ? fmtDate(job.appliedAt)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Tagged CV
            </dt>
            <dd className="mt-1">
              <CvPicker
                jobId={job.id}
                cvId={job.cvId}
                options={cvs.map((c) => ({ id: c.id, label: c.label }))}
              />
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

      <div className="mt-6">
        <StageStepper jobId={job.id} currentStage={job.currentStage} />
      </div>

      <div className="mt-6">
        <CompanyResearchPanel
          jobId={job.id}
          hasCompany={Boolean(job.companyId)}
          initialBrief={job.company?.aiBrief ?? null}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <MatchScorePanel jobId={job.id} />
        <TailorPanel jobId={job.id} />
      </div>

      <div className="mt-6">
        <InterviewSection
          jobId={job.id}
          jobTitle={job.title}
          interviews={job.interviews.map((iv) => ({
            id: iv.id,
            type: iv.type,
            stage: iv.stage,
            scheduledAt: iv.scheduledAt ? iv.scheduledAt.toISOString() : null,
            outcome: iv.outcome,
            prepNotes: iv.prepNotes,
          }))}
        />
      </div>

      <div className="mt-6">
        <NoteSection
          jobId={job.id}
          notes={job.notes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">Edit job</h2>
          <div className="flex items-center gap-4">
            <ArchiveJobButton jobId={job.id} />
            <DeleteJobButton jobId={job.id} />
          </div>
        </div>
        <JobForm
          initial={{
            id: job.id,
            title: job.title,
            companyName: job.company?.name ?? "",
            companyWebsite: job.company?.website ?? "",
            url: job.url ?? "",
            salaryAmount: job.salaryAmount,
            salaryCurrency: job.salaryCurrency,
            salaryPeriod: job.salaryPeriod,
            location: job.location ?? "",
            description: job.description ?? "",
          }}
        />
      </section>
    </main>
  );
}
