"use client";

import { useRouter } from "next/navigation";

export interface CvOption {
  id: string;
  label: string;
}

export default function CvPicker({
  jobId,
  cvId,
  options,
}: {
  jobId: string;
  cvId: string | null;
  options: CvOption[];
}) {
  const router = useRouter();

  async function assign(value: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvId: value || null }),
    });
    router.refresh();
  }

  return (
    <select
      value={cvId ?? ""}
      onChange={(e) => assign(e.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      <option value="">No CV tagged</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
