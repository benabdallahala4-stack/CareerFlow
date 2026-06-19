"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingActions({ plan }: { plan: "FREE" | "PRO" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function change(to: "FREE" | "PRO") {
    setLoading(true);
    await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: to }),
    });
    setLoading(false);
    router.refresh();
  }

  if (plan === "PRO") {
    return (
      <button
        onClick={() => change("FREE")}
        disabled={loading}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? "…" : "Downgrade to Free"}
      </button>
    );
  }
  return (
    <button
      onClick={() => change("PRO")}
      disabled={loading}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? "…" : "Upgrade to Pro"}
    </button>
  );
}
