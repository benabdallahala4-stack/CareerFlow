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
import { fmtDateTime } from "@/lib/format";
import { buildInterviewPrepUrl } from "@/lib/devmaster";

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
  jobTitle,
  interviews,
}: {
  jobId: string;
  jobTitle: string;
  interviews: InterviewRow[];
}) {
  const router = useRouter();
  const [type, setType] = useState<InterviewType>("PHONE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<InterviewType>("PHONE");
  const [editWhen, setEditWhen] = useState("");
  const [editPrep, setEditPrep] = useState("");

  function toLocalInput(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function startEdit(iv: InterviewRow) {
    setEditingId(iv.id);
    setEditType(iv.type as InterviewType);
    setEditWhen(toLocalInput(iv.scheduledAt));
    setEditPrep(iv.prepNotes ?? "");
  }

  async function saveEdit(id: string) {
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: editType, scheduledAt: editWhen || null, prepNotes: editPrep }),
    });
    setEditingId(null);
    router.refresh();
  }

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
              .map((iv) =>
                editingId === iv.id ? (
                  <div key={iv.id} className="flex flex-wrap items-center gap-2 px-1 py-1.5">
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as InterviewType)}
                      className={inputClass}
                    >
                      {INTERVIEW_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={editWhen}
                      onChange={(e) => setEditWhen(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      placeholder="Prep notes"
                      value={editPrep}
                      onChange={(e) => setEditPrep(e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={() => saveEdit(iv.id)}
                      className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-zinc-500 hover:underline">
                      cancel
                    </button>
                  </div>
                ) : (
                  <div key={iv.id} className="group flex flex-wrap items-center gap-3 px-1 py-1.5 text-sm">
                    <span className="font-medium text-zinc-700">{iv.type}</span>
                    <span className="text-zinc-500">
                      {iv.scheduledAt ? fmtDateTime(iv.scheduledAt) : "unscheduled"}
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
                    <a
                      href={buildInterviewPrepUrl(iv.type, jobTitle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open a tailored mock interview in DevMaster Hub"
                      className="text-xs font-medium text-indigo-500 hover:text-indigo-700"
                    >
                      Prep →
                    </a>
                    <button onClick={() => startEdit(iv)} className="text-xs text-zinc-400 hover:text-indigo-600">
                      edit
                    </button>
                    <button onClick={() => remove(iv.id)} className="text-xs text-zinc-400 hover:text-rose-500">
                      delete
                    </button>
                  </div>
                )
              )}
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
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-4 py-2 text-sm font-medium text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}
