"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDERS, type ProviderName } from "@/services/ai/types";

export interface SettingRow {
  id: string;
  provider: string;
  model: string | null;
  isActive: boolean;
  priority: number;
  hasKey: boolean;
}

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function AiSettingsManager({ settings }: { settings: SettingRow[] }) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderName>("GROQ");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/ai/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model: model || null, priority }),
    });
    setSaving(false);
    setApiKey("");
    setModel("");
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/ai/settings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/ai/settings/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-2">
        {settings.length === 0 && (
          <p className="text-sm text-zinc-400">
            No AI providers yet. Add a free Groq or Gemini key to enable AI features.
          </p>
        )}
        {settings.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="font-medium text-zinc-800">{s.provider}</span>
            <span className="text-xs text-zinc-400">
              priority {s.priority} · {s.hasKey ? "key set" : "no key"}
              {s.model ? ` · ${s.model}` : ""}
            </span>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={s.isActive}
                onChange={(e) => toggle(s.id, e.target.checked)}
              />
              active
            </label>
            <button
              onClick={() => remove(s.id)}
              className="text-xs text-zinc-400 hover:text-rose-500"
            >
              delete
            </button>
          </div>
        ))}
      </section>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-zinc-800">Add provider</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Keys are stored locally only. Groq &amp; Gemini have free tiers.
        </p>
        <form onSubmit={add} className="flex flex-col gap-3">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ProviderName)}
            className={inputClass}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="API key (blank for Ollama)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Model (optional)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Priority (1 = first)"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value || "1", 10))}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add provider"}
          </button>
        </form>
      </aside>
    </div>
  );
}
