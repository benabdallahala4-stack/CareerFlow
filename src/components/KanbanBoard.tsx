"use client";

import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import KanbanColumn from "./KanbanColumn";
import { JobCardData } from "./JobCard";
import { BOARD_COLUMNS } from "@/lib/constants";

interface BoardJob extends JobCardData {
  status: string;
}

export default function KanbanBoard({ initialJobs }: { initialJobs: BoardJob[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<BoardJob[]>(initialJobs);

  async function handleDragEnd(event: DragEndEvent) {
    const jobId = String(event.active.id);
    const newStatus = event.over ? String(event.over.id) : null;
    if (!newStatus) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    // optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    await fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, boardOrder: 0 }),
    });
    router.refresh();
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobs.filter((j) => j.status === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
