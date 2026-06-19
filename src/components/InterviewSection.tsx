"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  INTERVIEW_TYPES,
  INTERVIEW_OUTCOMES,
  INTERVIEW_STAGES,
  STAGE_META,
  type InterviewType,
  type InterviewStage,
} from "@/lib/constants";

export interface InterviewRow {
  id: string;
  type: string;
  stage: string | null;
  scheduledAt: string | null;
  outcome: string;
  prepNotes: string | null;
}

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function InterviewSection({
  jobId,
  interviews,
}: {
  jobId: string;
  interviews: InterviewRow[];
}) {
  const router = useRouter();
  const [type, setType] = useState<InterviewType>("PHONE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function addInterview(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/jobs/${jobId}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, scheduledAt: scheduledAt || null, prepNotes }),
    });
    setSaving(false);
    setScheduledAt("");
    setPrepNotes("");
    router.refresh();
  }

  async function setOutcome(id: string, outcome: string) {
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">Interviews</h2>

      <div className="flex flex-col gap-2">
        {interviews.length === 0 && (
          <p className="text-sm text-zinc-400">No interviews logged yet.</p>
        )}
        {INTERVIEW_STAGES.filter((st) =>
          interviews.some((iv) => (iv.stage ?? "SCREENING") === st)
        ).map((st) => (
          <div key={st} className="rounded-lg border border-zinc-100 p-2">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-zinc-500">
              <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[st as InterviewStage].dot}`} />
              {STAGE_META[st as InterviewStage].label}
            </div>
            {interviews
              .filter((iv) => (iv.stage ?? "SCREENING") === st)
              .map((iv) => (
                <div key={iv.id} className="flex flex-wrap items-center gap-3 px-1 py-1.5 text-sm">
                  <span className="font-medium text-zinc-700">{iv.type}</span>
                  <span className="text-zinc-500">
                    {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : "unscheduled"}
                  </span>
                  {iv.prepNotes && <span className="text-xs text-zinc-400">— {iv.prepNotes}</span>}
                  <select
                    value={iv.outcome}
                    onChange={(e) => setOutcome(iv.id, e.target.value)}
                    className="ml-auto rounded border border-zinc-200 px-2 py-1 text-xs"
                  >
                    {INTERVIEW_OUTCOMES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <button onClick={() => remove(iv.id)} className="text-xs text-zinc-400 hover:text-rose-500">
                    delete
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      <form
        onSubmit={addInterview}
        className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4"
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InterviewType)}
          className={inputClass}
        >
          {INTERVIEW_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Prep notes"
          value={prepNotes}
          onChange={(e) => setPrepNotes(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}
