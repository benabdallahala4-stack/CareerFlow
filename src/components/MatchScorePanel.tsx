"use client";

import { useState } from "react";

export default function MatchScorePanel({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number | null;
    missing: string[];
    usedFallback: boolean;
  } | null>(null);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">CV match score</h2>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {result.score ?? "—"}
            </span>
            <span className="text-sm text-zinc-400">/ 100</span>
            {result.usedFallback && (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                keyword match (no AI key)
              </span>
            )}
          </div>
          {result.missing.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Missing keywords
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.missing.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-zinc-400">
            Tag a CV with content on this job for the most accurate score.
          </p>
        </div>
      )}
    </section>
  );
}
