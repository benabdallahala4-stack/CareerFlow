"use client";

import { useState } from "react";

export default function TailorPanel({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    setText(data.text);
    setFallback(data.usedFallback);
    setLoading(false);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Tailor CV to this job</h2>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Working…" : "Suggest"}
        </button>
      </div>
      {text && (
        <>
          {fallback && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No AI key configured — showing general guidance.
            </p>
          )}
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-zinc-700">{text}</pre>
        </>
      )}
    </section>
  );
}
