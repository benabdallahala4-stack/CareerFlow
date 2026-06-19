import Link from "next/link";
import type { Nudge } from "@/services/nudge-service";

const KIND_DOT: Record<string, string> = {
  FOLLOW_UP: "bg-amber-500",
  ADD_PREP: "bg-violet-500",
  TAG_CV: "bg-blue-500",
};

export default function HomeNudges({ nudges }: { nudges: Nudge[] }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">Needs your attention</h2>
      {nudges.length === 0 ? (
        <p className="text-sm text-zinc-400">You&apos;re all caught up. Nice.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {nudges.map((n, i) => (
            <li key={i}>
              <Link
                href={`/jobs/${n.jobId}`}
                className="flex items-center gap-2.5 rounded-lg border border-zinc-100 px-3 py-2 text-sm hover:bg-zinc-50"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[n.kind] ?? "bg-zinc-400"}`} />
                <span className="text-zinc-700">{n.message}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
