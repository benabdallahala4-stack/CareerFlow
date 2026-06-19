"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";

export interface JobCardData {
  id: string;
  title: string;
  company?: { name: string } | null;
  location?: string | null;
}

export default function JobCard({ job }: { job: JobCardData }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 hover:shadow ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-indigo-200" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          {...listeners}
          {...attributes}
          className="flex-1 cursor-grab active:cursor-grabbing"
        >
          <div className="text-sm font-medium leading-snug text-zinc-800">
            {job.title}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {job.company?.name ?? "No company"}
            {job.location ? ` · ${job.location}` : ""}
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="rounded-md px-1.5 py-0.5 text-xs text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-indigo-600 group-hover:opacity-100"
        >
          open
        </Link>
      </div>
    </div>
  );
}
