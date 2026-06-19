const ACCENTS: Record<string, string> = {
  indigo: "from-indigo-500 to-violet-500",
  violet: "from-violet-500 to-fuchsia-500",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
  blue: "from-blue-500 to-indigo-500",
};

export default function StatCard({
  label,
  value,
  hint,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: keyof typeof ACCENTS | string;
}) {
  return (
    <div className="card card-hover relative overflow-hidden p-5">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ACCENTS[accent] ?? ACCENTS.indigo}`} />
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}
