"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function del() {
    setLoading(true);
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    router.push("/board");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-sm text-rose-500 hover:underline">
        Delete job
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">Delete this job?</span>
      <button
        onClick={del}
        disabled={loading}
        className="rounded-md bg-rose-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Yes, delete"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-zinc-500 hover:underline">
        cancel
      </button>
    </span>
  );
}
