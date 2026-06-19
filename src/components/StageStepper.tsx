"use client";

import { useRouter } from "next/navigation";
import { INTERVIEW_STAGES, STAGE_META, type InterviewStage } from "@/lib/constants";

export default function StageStepper({
  jobId,
  currentStage,
}: {
  jobId: string;
  currentStage: string | null;
}) {
  const router = useRouter();
  const currentIdx = currentStage
    ? INTERVIEW_STAGES.indexOf(currentStage as InterviewStage)
    : -1;
  const nextStage = INTERVIEW_STAGES[currentIdx + 1];

  async function setStage(stage: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStage: stage }),
    });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Interview progress</h2>
        {nextStage && (
          <button
            onClick={() => setStage(nextStage)}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-violet-600/20 px-3 py-1.5 text-xs font-medium text-white hover:from-indigo-500 hover:to-violet-500"
          >
            Advance to {STAGE_META[nextStage].label}
          </button>
        )}
      </div>
      <ol className="flex flex-wrap items-center gap-2">
        {INTERVIEW_STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={stage} className="flex items-center gap-2">
              <button
                onClick={() => setStage(stage)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "border-indigo-300 bg-indigo-50 font-medium text-indigo-700"
                    : done
                    ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                    : "border-zinc-200 text-zinc-400 hover:bg-zinc-50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[stage].dot}`} />
                {STAGE_META[stage].label}
                {done && <span className="text-emerald-500">✓</span>}
              </button>
              {i < INTERVIEW_STAGES.length - 1 && <span className="text-zinc-300">→</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
