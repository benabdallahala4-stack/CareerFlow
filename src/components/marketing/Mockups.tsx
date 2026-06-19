// Pure-CSS mockups for the marketing page — no real screenshots needed.

export function BoardMockup() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm">
      <div className="flex gap-2">
        {[
          { label: "Wishlist", dot: "bg-zinc-400", n: 2 },
          { label: "Applied", dot: "bg-blue-500", n: 3 },
          { label: "Interview", dot: "bg-amber-500", n: 1 },
        ].map((c) => (
          <div key={c.label} className="flex-1 rounded-lg border border-zinc-200 bg-white p-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              {c.label}
            </div>
            {Array.from({ length: c.n }).map((_, i) => (
              <div key={i} className="mb-1 rounded border border-zinc-100 px-1.5 py-1">
                <div className="h-1.5 w-3/4 rounded bg-zinc-200" />
                <div className="mt-1 h-1 w-1/2 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceMockup() {
  const stages = ["Applied", "Screening", "Technical", "Onsite", "Final"];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {stages.map((s, i) => (
          <span
            key={s}
            className={`rounded-full border px-2 py-0.5 text-[11px] ${
              i === 2
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : i < 2
                ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                : "border-zinc-200 text-zinc-400"
            }`}
          >
            {s}
            {i < 2 ? " ✓" : ""}
          </span>
        ))}
      </div>
      <div className="space-y-1.5">
        {["Phone screen — Passed", "Technical — Pending"].map((t) => (
          <div key={t} className="flex items-center gap-2 rounded border border-zinc-100 px-2 py-1.5 text-[11px] text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiMockup() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold text-zinc-500">CV match score</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-zinc-900">78</span>
        <span className="text-xs text-zinc-400">/ 100</span>
      </div>
      <div className="mt-3 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        Missing keywords
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {["GraphQL", "Kubernetes", "CI/CD", "Terraform"].map((k) => (
          <span key={k} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
