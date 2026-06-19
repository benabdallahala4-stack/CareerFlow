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

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    if (file) {
      const fd = new FormData();
      fd.set("label", label);
      fd.set("file", file);
      await fetch("/api/cvs", { method: "POST", body: fd });
    } else {
      await fetch("/api/cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, content }),
      });
    }
    setSaving(false);
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
            placeholder="Label (e.g. Backend v2) *"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            required
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm"
          />
          <textarea
            placeholder="…or paste CV text here"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add CV"}
          </button>
        </form>
      </aside>
    </div>
  );
}
