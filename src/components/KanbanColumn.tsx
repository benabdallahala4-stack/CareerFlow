"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import JobCard, { JobCardData } from "./JobCard";
import { STATUS_META, type JobStatus } from "@/lib/constants";

export default function KanbanColumn({
  status,
  jobs,
}: {
  status: string;
  jobs: JobCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status as JobStatus] ?? STATUS_META.WISHLIST;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-col rounded-xl border p-2.5 transition-colors ${
        isOver ? "border-indigo-300 bg-indigo-50/60" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2 px-1.5">
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        <h2 className="text-sm font-semibold text-zinc-700">{meta.label}</h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
          {jobs.length}
        </span>
      </div>

      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[60px] flex-col gap-2">
          {jobs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400">
              Drop jobs here
            </p>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
