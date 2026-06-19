"use client";

import { useRouter } from "next/navigation";

export interface SuggestionRow {
  id: string;
  classification: string;
  proposedStatus: string;
  fromEmail: string | null;
  subject: string | null;
  jobId: string | null;
}

const LABEL: Record<string, string> = {
  INTERVIEW: "Possible interview",
  OFFER: "Possible offer",
  REJECTION: "Possible rejection",
};

export default function HomeSuggestions({ suggestions }: { suggestions: SuggestionRow[] }) {
  const router = useRouter();
  if (suggestions.length === 0) return null;

  async function act(id: string, action: "apply" | "dismiss") {
    await fetch(`/api/suggestions/${id}/${action}`, { method: "POST" });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-indigo-900">Suggested updates from your inbox</h2>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-zinc-800">
                {LABEL[s.classification] ?? "Update"}
                {s.fromEmail ? ` from ${s.fromEmail}` : ""}
              </div>
              {s.subject && <div className="truncate text-xs text-zinc-500">{s.subject}</div>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => act(s.id, "apply")}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Move to {s.proposedStatus}
              </button>
              <button
                onClick={() => act(s.id, "dismiss")}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
