"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { login } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [error, action] = useFormState(login, undefined);

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-sm flex-col justify-center p-6">
      <div className="card p-7 shadow-xl shadow-violet-900/5">
        <div className="brand-gradient mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white shadow-md shadow-violet-600/25">
          C
        </div>
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
        <p className="mb-6 text-sm text-zinc-500">Sign in to your CareerFlow OS.</p>

        <form action={action} className="flex flex-col gap-3">
        <input className={inputClass} name="email" type="email" placeholder="Email" required />
        <input className={inputClass} name="password" type="password" placeholder="Password" required />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <SubmitButton />
        </form>

        <p className="mt-4 text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
