"use client";

import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const router = useRouter();
  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    router.refresh();
  }
  return (
    <button
      onClick={markAll}
      className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
    >
      Mark all read
    </button>
  );
}
