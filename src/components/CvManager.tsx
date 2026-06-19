"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CvRow {
  id: string;
  label: string;
  isDefault: boolean;
  hasFile: boolean;
  hasContent: boolean;
  createdAt: string;
}

export default function CvManager({ cvs }: { cvs: CvRow[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A file OR pasted text (with a label) is enough to submit.
  const canSubmit = Boolean(file) || (label.trim() && content.trim());

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Choose a file, or add a label and paste CV text.");
      return;
    }
    setSaving(true);
    // Derive a label from the filename if none was typed.
    const effectiveLabel =
      label.trim() || (file ? file.name.replace(/\.[^.]+$/, "") : "Untitled CV");

    let res: Response;
    if (file) {
      const fd = new FormData();
      fd.set("label", effectiveLabel);
      fd.set("file", file);
      res = await fetch("/api/cvs", { method: "POST", body: fd });
    } else {
      res = await fetch("/api/cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: effectiveLabel, content }),
      });
    }
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed. Please try again.");
      return;
    }
    setLabel("");
    setFile(null);
    setContent("");
    router.refresh();
  }

  async function makeDefault(id: string) {
    await fetch(`/api/cvs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ makeDefault: true }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/cvs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-2">
        {cvs.length === 0 && (
          <p className="text-sm text-zinc-400">No CVs yet. Upload one →</p>
        )}
        {cvs.map((cv) => (
          <div
            key={cv.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-800">{cv.label}</span>
                {cv.isDefault && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    default
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">
                {cv.hasFile ? "file uploaded" : cv.hasContent ? "text only" : "empty"}
                {" · "}
                {new Date(cv.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs">
              {!cv.isDefault && (
                <button
                  onClick={() => makeDefault(cv.id)}
                  className="text-indigo-600 hover:underline"
                >
                  set default
                </button>
              )}
              <button
                onClick={() => remove(cv.id)}
                className="text-zinc-400 hover:text-rose-500"
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </section>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">Add a CV</h2>
        <form onSubmit={upload} className="flex flex-col gap-3">
          <input
            placeholder="Label (optional — defaults to file name)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs">Choose file</span>
            <span className="truncate text-zinc-500">{file ? file.name : "PDF, DOCX, TXT…"}</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          <textarea
            placeholder="…or paste CV text here"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-4 py-2 text-sm font-medium text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add CV"}
          </button>
        </form>
      </aside>
    </div>
  );
}
