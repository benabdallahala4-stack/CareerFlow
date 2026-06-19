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
      className={`rounded border bg-white p-3 shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div {...listeners} {...attributes} className="flex-1 cursor-grab">
          <div className="font-medium">{job.title}</div>
          <div className="text-sm text-gray-500">
            {job.company?.name ?? "—"}
            {job.location ? ` · ${job.location}` : ""}
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          open
        </Link>
      </div>
    </div>
  );
}
