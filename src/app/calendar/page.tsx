import Link from "next/link";
import { requireUserId } from "@/lib/auth-helpers";
import {
  listInterviewsInRange,
  listUpcomingInterviews,
} from "@/services/interview-service";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function monthBounds(monthParam?: string) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { year, month, start, end };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const userId = await requireUserId();
  const { year, month, start, end } = monthBounds(searchParams.month);
  const interviews = await listInterviewsInRange(
    userId,
    start.toISOString(),
    end.toISOString()
  );
  const upcoming = await listUpcomingInterviews(userId, 8);

  const byDay: Record<number, typeof interviews> = {};
  for (const iv of interviews) {
    if (!iv.scheduledAt) continue;
    const d = new Date(iv.scheduledAt).getDate();
    (byDay[d] ??= []).push(iv);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Calendar</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/calendar?month=${fmt(prev)}`} className="rounded-md border border-zinc-200 px-2.5 py-1 hover:bg-zinc-50">←</Link>
          <span className="min-w-[140px] text-center font-medium text-zinc-700">{monthLabel}</span>
          <Link href={`/calendar?month=${fmt(next)}`} className="rounded-md border border-zinc-200 px-2.5 py-1 hover:bg-zinc-50">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <div key={i} className="min-h-[72px] rounded-lg border border-zinc-100 p-1 text-xs">
                {d && <div className="mb-1 text-zinc-400">{d}</div>}
                {d &&
                  (byDay[d] ?? []).map((iv) => (
                    <Link
                      key={iv.id}
                      href={`/jobs/${iv.job.id}`}
                      className="mb-1 block truncate rounded bg-indigo-50 px-1 py-0.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
                      title={`${iv.job.title} — ${iv.type}`}
                    >
                      {iv.type} · {iv.job.title}
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-zinc-800">Upcoming</h2>
          {upcoming.length === 0 && <p className="text-sm text-zinc-400">No upcoming interviews.</p>}
          <ul className="flex flex-col gap-2">
            {upcoming.map((iv) => (
              <li key={iv.id}>
                <Link href={`/jobs/${iv.job.id}`} className="block rounded-lg border border-zinc-100 px-3 py-2 text-sm hover:bg-zinc-50">
                  <div className="font-medium text-zinc-700">{iv.job.title}</div>
                  <div className="text-xs text-zinc-400">
                    {iv.type} · {iv.scheduledAt ? fmtDateTime(iv.scheduledAt) : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
