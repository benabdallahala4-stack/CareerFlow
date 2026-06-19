"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SALARY_CURRENCIES, SALARY_PERIODS, formatSalary } from "@/lib/constants";

interface JobFormProps {
  initial?: {
    id?: string;
    title?: string;
    url?: string;
    salaryAmount?: number | null;
    salaryCurrency?: string | null;
    salaryPeriod?: string | null;
    location?: string;
    description?: string;
  };
  onDone?: () => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function JobForm({ initial, onDone }: JobFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [salaryAmount, setSalaryAmount] = useState(
    initial?.salaryAmount != null ? String(initial.salaryAmount) : ""
  );
  const [salaryCurrency, setSalaryCurrency] = useState(initial?.salaryCurrency ?? "EUR");
  const [salaryPeriod, setSalaryPeriod] = useState(initial?.salaryPeriod ?? "YEAR");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const amount = salaryAmount ? parseInt(salaryAmount.replace(/[^\d]/g, ""), 10) : null;
    const payload = {
      title,
      url,
      location,
      description,
      salaryAmount: amount,
      salaryCurrency: amount ? salaryCurrency : null,
      salaryPeriod: amount ? salaryPeriod : null,
      salary: formatSalary(amount, salaryCurrency, salaryPeriod) ?? null,
    };
    const res = await fetch(isEdit ? `/api/jobs/${initial!.id}` : "/api/jobs", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      if (!isEdit) {
        setTitle("");
        setUrl("");
        setSalaryAmount("");
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
        className={inputClass}
        placeholder="Job title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className={inputClass}
        placeholder="Job posting URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Salary (gross)</label>
        <div className="flex gap-2">
          <input
            className={inputClass}
            inputMode="numeric"
            placeholder="Amount"
            value={salaryAmount}
            onChange={(e) => setSalaryAmount(e.target.value)}
          />
          <select
            className={`${inputClass} w-auto`}
            value={salaryCurrency}
            onChange={(e) => setSalaryCurrency(e.target.value)}
          >
            {SALARY_CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            className={`${inputClass} w-auto`}
            value={salaryPeriod}
            onChange={(e) => setSalaryPeriod(e.target.value)}
          >
            {SALARY_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <input
        className={inputClass}
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <textarea
        className={inputClass}
        placeholder="Description / notes"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving || !title}
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-4 py-2 text-sm font-medium text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : isEdit ? "Save changes" : "Add job"}
      </button>
    </form>
  );
}
