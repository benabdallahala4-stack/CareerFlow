"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { login } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [error, action] = useFormState(login, undefined);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center p-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-zinc-900">
        Welcome back
      </h1>
      <p className="mb-6 text-sm text-zinc-500">Sign in to your CareerFlow OS.</p>

      <form action={action} className="flex flex-col gap-3">
        <input className={inputClass} name="email" type="email" placeholder="Email" required />
        <input className={inputClass} name="password" type="password" placeholder="Password" required />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <SubmitButton />
      </form>

      <p className="mt-4 text-sm text-zinc-500">
        No account?{" "}
        <Link href="/signup" className="text-indigo-600 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
