"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import JobCard, { JobCardData, JobCardView } from "./JobCard";
import { BOARD_COLUMNS } from "@/lib/constants";

interface BoardJob extends JobCardData {
  status: string;
}

export default function KanbanBoard({ initialJobs }: { initialJobs: BoardJob[] }) {
  const [jobs, setJobs] = useState<BoardJob[]>(initialJobs);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const jobId = String(event.active.id);
    const newStatus = event.over ? String(event.over.id) : null;
    if (!newStatus) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, boardOrder: 0 }),
    }).catch(() => {});
  }

  const activeJob = activeId ? jobs.find((j) => j.id === activeId) ?? null : null;

  const q = query.trim().toLowerCase();
  const visible = q
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.company?.name ?? "").toLowerCase().includes(q) ||
          (j.location ?? "").toLowerCase().includes(q)
      )
    : jobs;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs by title, company, or location…"
          className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BOARD_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={visible.filter((j) => j.status === status)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeJob ? <JobCardView job={activeJob} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
