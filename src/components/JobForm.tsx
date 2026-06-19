"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface JobFormProps {
  initial?: {
    id?: string;
    title?: string;
    url?: string;
    salary?: string;
    location?: string;
    description?: string;
  };
  onDone?: () => void;
}

export default function JobForm({ initial, onDone }: JobFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [salary, setSalary] = useState(initial?.salary ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { title, url, salary, location, description };
    const res = await fetch(
      isEdit ? `/api/jobs/${initial!.id}` : "/api/jobs",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (res.ok) {
      if (!isEdit) {
        setTitle("");
        setUrl("");
        setSalary("");
        setLocation("");
        setDescription("");
      }
      onDone?.();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        className="border rounded px-3 py-2"
        placeholder="Job title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Job posting URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Salary"
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <textarea
        className="border rounded px-3 py-2"
        placeholder="Description / notes"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving || !title}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {saving ? "Saving…" : isEdit ? "Save changes" : "Add job"}
      </button>
    </form>
  );
}
