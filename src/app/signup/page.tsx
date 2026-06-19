"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create account.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-sm flex-col justify-center p-6">
      <div className="card p-7 shadow-xl shadow-violet-900/5">
        <div className="brand-gradient mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white shadow-md shadow-violet-600/25">
          C
        </div>
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-zinc-900">Create your account</h1>
        <p className="mb-6 text-sm text-zinc-500">Start tracking your job search.</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
          <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (6+ characters)" required />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
