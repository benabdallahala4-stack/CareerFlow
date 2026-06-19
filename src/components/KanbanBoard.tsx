"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { JobCardData } from "./JobCard";
import { BOARD_COLUMNS } from "@/lib/constants";

interface BoardJob extends JobCardData {
  status: string;
}

export default function KanbanBoard({ initialJobs }: { initialJobs: BoardJob[] }) {
  const [jobs, setJobs] = useState<BoardJob[]>(initialJobs);

  // A small activation distance makes drags start crisply (and lets plain
  // clicks through to the card link).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const jobId = String(event.active.id);
    const newStatus = event.over ? String(event.over.id) : null;
    if (!newStatus) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    // Optimistic update only — persist in the background, no full re-render.
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, boardOrder: 0 }),
    }).catch(() => {});
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
