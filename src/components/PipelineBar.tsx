import { BOARD_COLUMNS, STATUS_META, type JobStatus } from "@/lib/constants";

export default function PipelineBar({
  byStatus,
}: {
  byStatus: Record<JobStatus, number>;
}) {
  const total = BOARD_COLUMNS.reduce((sum, s) => sum + byStatus[s], 0) || 1;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">Pipeline</h2>
      <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100">
        {BOARD_COLUMNS.map((s) =>
          byStatus[s] > 0 ? (
            <div
              key={s}
              className={STATUS_META[s].dot}
              style={{ width: `${(byStatus[s] / total) * 100}%` }}
              title={`${STATUS_META[s].label}: ${byStatus[s]}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {BOARD_COLUMNS.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
            <span className="text-zinc-600">{STATUS_META[s].label}</span>
            <span className="font-medium text-zinc-900">{byStatus[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
