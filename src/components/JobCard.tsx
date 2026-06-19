"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";

export interface JobCardData {
  id: string;
  title: string;
  company?: { name: string } | null;
  location?: string | null;
}

// Pure visual card — reused by the draggable card and the drag overlay.
export function JobCardView({
  job,
  listeners,
  attributes,
  overlay = false,
}: {
  job: JobCardData;
  listeners?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  overlay?: boolean;
}) {
  return (
    <div
      className={`group rounded-lg border border-zinc-200 bg-white p-3 ${
        overlay ? "shadow-xl ring-2 ring-indigo-300 cursor-grabbing" : "shadow-sm transition-shadow hover:shadow"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div {...listeners} {...attributes} className="flex-1 cursor-grab active:cursor-grabbing">
          <div className="text-sm font-medium leading-snug text-zinc-800">{job.title}</div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {job.company?.name ?? "No company"}
            {job.location ? ` · ${job.location}` : ""}
          </div>
        </div>
        {!overlay && (
          <Link
            href={`/jobs/${job.id}`}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 transition hover:bg-indigo-100 hover:text-indigo-700"
          >
            Open
          </Link>
        )}
      </div>
    </div>
  );
}

export default function JobCard({ job }: { job: JobCardData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-30" : ""}>
      <JobCardView
        job={job}
        listeners={listeners as Record<string, unknown> | undefined}
        attributes={attributes as unknown as Record<string, unknown>}
      />
    </div>
  );
}
