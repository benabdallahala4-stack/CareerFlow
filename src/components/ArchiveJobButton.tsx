"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArchiveJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function archive() {
    setLoading(true);
    await fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARCHIVED", boardOrder: 0 }),
    });
    router.push("/board");
    router.refresh();
  }

  return (
    <button
      onClick={archive}
      disabled={loading}
      className="text-sm text-zinc-500 hover:text-zinc-800 hover:underline"
    >
      {loading ? "Archiving…" : "Archive"}
    </button>
  );
}
