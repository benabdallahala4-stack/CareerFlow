"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import { JobCardData, JobCardView } from "./JobCard";
import { BOARD_COLUMNS, STATUS_META, type JobStatus } from "@/lib/constants";

interface BoardJob extends JobCardData {
  status: string;
}

const COLS = [...BOARD_COLUMNS, "ARCHIVED"];

export default function KanbanBoard({ initialJobs }: { initialJobs: BoardJob[] }) {
  const [byId] = useState<Record<string, BoardJob>>(() =>
    Object.fromEntries(initialJobs.map((j) => [j.id, j]))
  );
  const [containers, setContainers] = useState<Record<string, string[]>>(() => {
    const c: Record<string, string[]> = {};
    for (const col of COLS) c[col] = [];
    for (const j of initialJobs) (c[j.status] ??= []).push(j.id);
    return c;
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function findContainer(id: string): string | undefined {
    if (id in containers) return id;
    return COLS.find((col) => containers[col]?.includes(id));
  }

  function persist(next: Record<string, string[]>) {
    const items: { id: string; status: string; boardOrder: number }[] = [];
    for (const col of COLS) (next[col] ?? []).forEach((id, i) => items.push({ id, status: col, boardOrder: i }));
    fetch("/api/jobs/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => {});
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const aId = String(e.active.id);
    const oId = e.over ? String(e.over.id) : null;
    if (!oId) return;
    const from = findContainer(aId);
    const to = findContainer(oId);
    if (!from || !to || from === to) return;
    setContainers((prev) => {
      const fromItems = prev[from].filter((id) => id !== aId);
      const toItems = [...prev[to]];
      const overIndex = toItems.indexOf(oId);
      toItems.splice(overIndex >= 0 ? overIndex : toItems.length, 0, aId);
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const aId = String(e.active.id);
    const oId = e.over ? String(e.over.id) : null;
    setActiveId(null);
    if (!oId) return persist(containers);
    const from = findContainer(aId);
    const to = findContainer(oId);
    if (!from || !to) return;
    let next = containers;
    if (from === to) {
      const items = containers[to];
      const oldIndex = items.indexOf(aId);
      const newIndex = items.indexOf(oId);
      if (oldIndex !== newIndex && newIndex >= 0) {
        next = { ...containers, [to]: arrayMove(items, oldIndex, newIndex) };
        setContainers(next);
      }
    }
    persist(next);
  }

  function restore(id: string) {
    setContainers((prev) => {
      const next = {
        ...prev,
        ARCHIVED: prev.ARCHIVED.filter((x) => x !== id),
        WISHLIST: [...prev.WISHLIST, id],
      };
      persist(next);
      return next;
    });
  }

  const q = query.trim().toLowerCase();
  const match = (id: string) => {
    if (!q) return true;
    const j = byId[id];
    return (
      j.title.toLowerCase().includes(q) ||
      (j.company?.name ?? "").toLowerCase().includes(q) ||
      (j.location ?? "").toLowerCase().includes(q)
    );
  };

  const activeJob = activeId ? byId[activeId] : null;
  const archivedIds = (containers.ARCHIVED ?? []).filter(match);

  const searchBox = (
    <div className="mb-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search jobs by title, company, or location…"
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );

  const archivedSection = archivedIds.length > 0 && (
    <div className="mt-6">
      <button onClick={() => setShowArchived((v) => !v)} className="text-sm text-zinc-500 hover:text-zinc-800">
        {showArchived ? "▾" : "▸"} Archived ({archivedIds.length})
      </button>
      {showArchived && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {archivedIds.map((id) => (
            <li key={id} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm">
              <span className="text-zinc-600">{byId[id].title}</span>
              <span className="text-xs text-zinc-400">{byId[id].company?.name ?? ""}</span>
              <button onClick={() => restore(id)} className="ml-auto text-xs text-indigo-600 hover:underline">
                restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Search mode: plain (non-draggable) filtered view — reordering is for the unfiltered board.
  if (q) {
    return (
      <div>
        {searchBox}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BOARD_COLUMNS.map((status) => {
            const ids = (containers[status] ?? []).filter(match);
            const meta = STATUS_META[status as JobStatus];
            return (
              <div key={status} className="flex min-h-[120px] flex-col rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
                <div className="mb-2.5 flex items-center gap-2 px-1.5">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold text-zinc-700">{meta.label}</h2>
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
                    {ids.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {ids.map((id) => (
                    <JobCardView key={id} job={byId[id]} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {archivedSection}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {searchBox}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BOARD_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={(containers[status] ?? []).map((id) => byId[id])}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeJob ? <JobCardView job={activeJob} overlay /> : null}
      </DragOverlay>
      {archivedSection}
    </DndContext>
  );
}
