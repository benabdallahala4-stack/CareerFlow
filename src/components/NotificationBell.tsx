"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fmtDateTime } from "@/lib/format";

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  jobId: string | null;
  read: boolean;
  createdAt: string;
}

const KIND_DOT: Record<string, string> = {
  STAGE_CHANGE: "bg-violet-500",
  STATUS_CHANGE: "bg-blue-500",
  REMINDER: "bg-amber-500",
  NUDGE: "bg-indigo-500",
  RECRUITER_REPLY: "bg-emerald-500",
  GENERIC: "bg-zinc-400",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const d = await res.json();
      setItems(d.items);
      setUnread(d.unread);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  function markOne(id: string) {
    fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-zinc-800">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">Nothing yet.</p>
            ) : (
              items.map((n) => {
                const inner = (
                  <div className={`flex items-start gap-2.5 px-4 py-2.5 ${n.read ? "" : "bg-indigo-50/50"}`}>
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[n.kind] ?? "bg-zinc-400"}`} />
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-800">{n.title}</div>
                      {n.body && <div className="truncate text-xs text-zinc-500">{n.body}</div>}
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        {fmtDateTime(n.createdAt)}
                      </div>
                    </div>
                  </div>
                );
                return n.jobId ? (
                  <Link
                    key={n.id}
                    href={`/jobs/${n.jobId}`}
                    onClick={() => {
                      markOne(n.id);
                      setOpen(false);
                    }}
                    className="block border-b border-zinc-50 last:border-0 hover:bg-zinc-50"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => markOne(n.id)}
                    className="block w-full border-b border-zinc-50 text-left last:border-0 hover:bg-zinc-50"
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
