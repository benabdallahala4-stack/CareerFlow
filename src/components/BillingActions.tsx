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
      className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-4 py-2 text-sm font-medium text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
    >
      {loading ? "…" : "Upgrade to Pro"}
    </button>
  );
}
