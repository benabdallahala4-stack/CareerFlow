import Link from "next/link";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const FEATURES = [
  { title: "Kanban job tracker", body: "Drag applications through Wishlist → Applied → Interview → Offer. Your whole search at a glance.", tag: "Free" },
  { title: "Interview management", body: "Log every interview, schedule, outcome, and prep note — like a CRM for your job hunt.", tag: "Free" },
  { title: "CV management", body: "Store multiple CV versions and tag which one you sent to each job. Know what works.", tag: "Free" },
  { title: "AI match score", body: "Paste a job description and see how well your CV fits, with the keywords you're missing.", tag: "AI" },
  { title: "AI assistant (BYOAI)", body: "Bring your own free Groq or Gemini key — tailoring, interview prep, and a career chat.", tag: "AI" },
  { title: "Dashboard analytics", body: "Response rate, offers, and interviews this week — measure your search, don't guess.", tag: "Free" },
];

const PROBLEMS = [
  { title: "The search is chaos", body: "Spreadsheets, tabs, and sticky notes. You lose track of who you applied to and when." },
  { title: "Applications slip away", body: "No follow-ups, no reminders. Good leads go cold because nothing nudged you." },
  { title: "Interviews catch you cold", body: "No structured prep means walking in underprepared for roles you actually want." },
];

export default async function LandingPage() {
  const session = await auth();
  const authed = Boolean(session?.user);

  return (
    <div className="text-zinc-800">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          AI-powered career operating system
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Land your next job faster with AI-powered career tracking
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500">
          CareerFlow OS replaces the spreadsheet chaos with one command center —
          track every application, manage interviews like a CRM, and use AI to sharpen
          your CV and prep. Free to start, no AI key required.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {authed ? (
            <Link href="/board" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
              Go to your board
            </Link>
          ) : (
            <>
              <Link href="/signup" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                Start free
              </Link>
              <Link href="/login" className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Sign in
              </Link>
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-zinc-400">No credit card. Core features free forever.</p>
      </section>

      {/* Mock dashboard strip */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
          <div className="flex gap-3 overflow-hidden">
            {["Wishlist", "Applied", "Interview", "Offer"].map((col, i) => (
              <div key={col} className="flex-1 rounded-xl border border-zinc-200 bg-white p-2.5">
                <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-zinc-600">
                  <span className={`h-2 w-2 rounded-full ${["bg-zinc-400", "bg-blue-500", "bg-amber-500", "bg-emerald-500"][i]}`} />
                  {col}
                </div>
                {Array.from({ length: 3 - (i % 2) }).map((_, k) => (
                  <div key={k} className="mb-1.5 rounded-lg border border-zinc-100 bg-white px-2 py-1.5">
                    <div className="h-2 w-3/4 rounded bg-zinc-200" />
                    <div className="mt-1 h-1.5 w-1/2 rounded bg-zinc-100" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900">
          Job hunting shouldn&apos;t be this messy
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-medium text-zinc-900">{p.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            One calm command center for the whole search
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
            Everything in one place: a visual pipeline, interview history, your CV versions,
            and an optional AI layer that works with your own free API key — or not at all.
            The app is fully useful without any AI.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900">
          Everything you need to run your search
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-900">{f.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.tag === "AI" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {f.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900">
            Simple, honest pricing
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">Free</h3>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">€0</p>
              <p className="mt-1 text-sm text-zinc-500">Everything you need to land a job.</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                <li>✓ Kanban job tracker</li>
                <li>✓ Interview & CV management</li>
                <li>✓ Dashboard analytics</li>
                <li>✓ AI features with your own free key</li>
              </ul>
              <Link href={authed ? "/board" : "/signup"} className="mt-6 block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700">
                {authed ? "Go to your board" : "Start free"}
              </Link>
            </div>
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900">Pro</h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">Coming soon</span>
              </div>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">€10–30<span className="text-base font-normal text-zinc-400">/mo</span></p>
              <p className="mt-1 text-sm text-zinc-500">For when you want it all done for you.</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                <li>• Managed AI (no key needed)</li>
                <li>• Email automation &amp; auto-status</li>
                <li>• Smart follow-up reminders</li>
                <li>• Advanced analytics &amp; notifications</li>
              </ul>
              <button disabled className="mt-6 block w-full cursor-not-allowed rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-400">
                Not yet available
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Start landing interviews, not losing track
        </h2>
        <p className="mt-4 text-zinc-500">
          Free to start. Set it up in a minute and track your very next application.
        </p>
        <div className="mt-8">
          <Link href={authed ? "/board" : "/signup"} className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
            {authed ? "Go to your board" : "Start free"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-400">
        CareerFlow OS — your AI-powered career command center.
      </footer>
    </div>
  );
}
