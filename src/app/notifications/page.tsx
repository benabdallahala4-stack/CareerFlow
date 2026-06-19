import Link from "next/link";
import { requireUserId } from "@/lib/auth-helpers";
import { listNotifications } from "@/services/notification-service";
import MarkAllReadButton from "@/components/MarkAllReadButton";

export const dynamic = "force-dynamic";

const KIND_DOT: Record<string, string> = {
  STAGE_CHANGE: "bg-violet-500",
  STATUS_CHANGE: "bg-blue-500",
  REMINDER: "bg-amber-500",
  NUDGE: "bg-indigo-500",
  RECRUITER_REPLY: "bg-emerald-500",
  GENERIC: "bg-zinc-400",
};

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const items = await listNotifications(userId, 50);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Notifications</h1>
        <MarkAllReadButton />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">Nothing yet. We&apos;ll let you know when something needs you.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const inner = (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  n.read ? "border-zinc-100 bg-white" : "border-indigo-100 bg-indigo-50/40"
                }`}
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[n.kind] ?? "bg-zinc-400"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-800">{n.title}</div>
                  {n.body && <div className="text-sm text-zinc-500">{n.body}</div>}
                  <div className="mt-0.5 text-xs text-zinc-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.jobId ? <Link href={`/jobs/${n.jobId}`}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
