"use client";

import { useDroppable } from "@dnd-kit/core";
import JobCard, { JobCardData } from "./JobCard";

export default function KanbanColumn({
  status,
  jobs,
}: {
  status: string;
  jobs: JobCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg p-2 ${
        isOver ? "bg-blue-50" : "bg-gray-100"
      }`}
    >
      <h2 className="px-1 text-sm font-semibold text-gray-700">
        {status} <span className="text-gray-400">({jobs.length})</span>
      </h2>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
