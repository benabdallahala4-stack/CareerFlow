"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/format";

export interface NoteRow {
  id: string;
  body: string;
  createdAt: string;
}

export default function NoteSection({
  jobId,
  notes,
}: {
  jobId: string;
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editText }),
    });
    setEditingId(null);
    router.refresh();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await fetch(`/api/jobs/${jobId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSaving(false);
    setBody("");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">Notes</h2>

      <div className="flex flex-col gap-2">
        {notes.length === 0 && (
          <p className="text-sm text-zinc-400">No notes yet.</p>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className="group rounded-lg border border-zinc-100 px-3 py-2 text-sm"
          >
            {editingId === n.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(n.id)}
                    className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-zinc-500 hover:underline">
                    cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-zinc-700">{n.body}</p>
                  <div className="flex shrink-0 gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(n.id);
                        setEditText(n.body);
                      }}
                      className="text-xs text-zinc-400 hover:text-indigo-600"
                    >
                      edit
                    </button>
                    <button onClick={() => remove(n.id)} className="text-xs text-zinc-400 hover:text-rose-500">
                      delete
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{fmtDateTime(n.createdAt)}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={addNote} className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
        <input
          placeholder="Add a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-4 py-2 text-sm font-medium text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}
