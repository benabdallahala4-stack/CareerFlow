import { STATUS_META, type JobStatus } from "@/lib/constants";

export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as JobStatus] ?? STATUS_META.WISHLIST;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
