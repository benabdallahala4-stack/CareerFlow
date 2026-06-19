"use client";

import { useState } from "react";

export default function CompanyResearchPanel({
  jobId,
  hasCompany,
  initialBrief,
}: {
  jobId: string;
  hasCompany: boolean;
  initialBrief: string | null;
}) {
  const [text, setText] = useState<string | null>(initialBrief);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);

  async function run(refresh: boolean) {
    setLoading(true);
    const res = await fetch("/api/ai/company-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, refresh }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setText(data.error ?? "Could not generate brief.");
      return;
    }
    setText(data.text);
    setFallback(Boolean(data.usedFallback));
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Company research</h2>
        {hasCompany && (
          <button
            onClick={() => run(Boolean(text))}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-3 py-1.5 text-xs font-medium text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {loading ? "Researching…" : text ? "Refresh" : "Research"}
          </button>
        )}
      </div>
      {!hasCompany && (
        <p className="mt-3 text-sm text-zinc-400">Add a company to this job to research it.</p>
      )}
      {fallback && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No AI key configured — showing a research checklist.
        </p>
      )}
      {text && <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-zinc-700">{text}</pre>}
    </section>
  );
}
