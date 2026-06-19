"use client";

import { useState } from "react";
import JobForm from "./JobForm";

export default function AddJobButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add job
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-12 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Add a job</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-xs text-zinc-500">New jobs start in Wishlist.</p>
            <JobForm onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
