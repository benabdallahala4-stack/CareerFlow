import Link from "next/link";
import { auth } from "@/auth";
import { BoardMockup, WorkspaceMockup, AiMockup } from "@/components/marketing/Mockups";

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
  const primaryHref = authed ? "/home" : "/signup";
  const primaryLabel = authed ? "Go to your dashboard" : "Start free";

  return (
    <div className="text-zinc-800">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 shadow-sm backdrop-blur">
            ✦ AI-powered career operating system
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Land your next job <br className="hidden sm:block" />
            <span className="brand-text">faster, with less chaos</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500">
            Track every application, manage interviews like a CRM, and use AI to sharpen your CV and
            prep. Free to start, no AI key required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href={primaryHref} className="btn-primary px-6 py-3 text-base">
              {primaryLabel} →
            </Link>
            {!authed && (
              <Link href="/login" className="btn-ghost px-6 py-3 text-base">
                Sign in
              </Link>
            )}
          </div>
          <p className="mt-3 text-xs text-zinc-400">No credit card. Core features free forever.</p>

          {/* Floating product preview */}
          <div className="relative mx-auto mt-14 max-w-4xl">
            <div className="pointer-events-none absolute inset-x-10 -top-6 h-24 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="card relative overflow-hidden p-4 shadow-2xl shadow-violet-900/10 ring-1 ring-black/5">
              <div className="flex gap-3 overflow-hidden">
                {[
                  { label: "Wishlist", dot: "bg-zinc-400", n: 2 },
                  { label: "Applied", dot: "bg-blue-500", n: 3 },
                  { label: "Interview", dot: "bg-amber-500", n: 1 },
                  { label: "Offer", dot: "bg-emerald-500", n: 1 },
                ].map((c, i) => (
                  <div key={c.label} className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5">
                    <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-zinc-600">
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      {c.label}
                    </div>
                    {Array.from({ length: c.n }).map((_, k) => (
                      <div
                        key={k}
                        className={`mb-1.5 rounded-lg border px-2 py-1.5 ${
                          i === 2 && k === 0
                            ? "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50"
                            : "border-zinc-100 bg-white"
                        }`}
                      >
                        <div className="h-1.5 w-3/4 rounded bg-zinc-300" />
                        <div className="mt-1.5 h-1 w-1/2 rounded bg-zinc-200" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">
          Job hunting shouldn&apos;t be this messy
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="card card-hover p-6">
              <h3 className="font-medium text-zinc-900">{p.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { n: "1", t: "Add your jobs", b: "Drop in roles you're applying to and drag them across the pipeline." },
            { n: "2", t: "Track & research", b: "Log interviews by stage, keep notes, and research each company with AI." },
            { n: "3", t: "Land it with AI", b: "Score your CV against the job, tailor it, and prep for the interview." },
          ].map((s) => (
            <div key={s.n} className="card card-hover p-6">
              <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-md shadow-violet-600/25">
                {s.n}
              </div>
              <h3 className="mt-3 font-medium text-zinc-900">{s.t}</h3>
              <p className="mt-1.5 text-sm text-zinc-500">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature deep-dives */}
      <section className="py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6">
          {[
            { t: "A pipeline that thinks like you do", b: "Drag every application through Wishlist → Applied → Interview → Offer. See your whole search in one glance.", m: <BoardMockup />, flip: false },
            { t: "An interview workspace per company", b: "Track multi-step interview progress, log each round by stage, and keep prep notes where you need them.", m: <WorkspaceMockup />, flip: true },
            { t: "AI that sharpens your application", b: "Score your CV against any job, see the keywords you're missing, get tailoring suggestions and interview prep — with your own free key.", m: <AiMockup />, flip: false },
          ].map((row, i) => (
            <div key={i} className={`grid items-center gap-8 md:grid-cols-2 ${row.flip ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">{row.t}</h3>
                <p className="mt-3 text-zinc-500">{row.b}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-4 ring-1 ring-black/5">{row.m}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">
          Everything you need to run your search
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-900">{f.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.tag === "AI" ? "bg-gradient-to-r from-indigo-100 to-fuchsia-100 text-indigo-700" : "bg-emerald-50 text-emerald-600"}`}>
                  {f.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">
            Simple, honest pricing
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-zinc-900">Free</h3>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">€0</p>
              <p className="mt-1 text-sm text-zinc-500">Everything you need to land a job.</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                <li>✓ Kanban job tracker</li>
                <li>✓ Interview &amp; CV management</li>
                <li>✓ Dashboard analytics</li>
                <li>✓ AI features with your own free key</li>
              </ul>
              <Link href={primaryHref} className="btn-primary mt-6 w-full">
                {authed ? "Go to your dashboard" : "Start free"}
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-white p-6 shadow-lg shadow-violet-600/10">
              <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-2 py-0.5 text-xs font-medium text-white">
                Coming soon
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Pro</h3>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">
                €10–30<span className="text-base font-normal text-zinc-400">/mo</span>
              </p>
              <p className="mt-1 text-sm text-zinc-500">For when you want it all done for you.</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                <li>• Managed AI (no key needed)</li>
                <li>• Email automation &amp; auto-status</li>
                <li>• Smart follow-up reminders</li>
                <li>• Advanced analytics &amp; notifications</li>
              </ul>
              <button disabled className="mt-6 w-full cursor-not-allowed rounded-xl border border-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-400">
                Not yet available
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">Frequently asked</h2>
        <div className="mt-10 flex flex-col gap-4">
          {[
            { q: "Is it really free?", a: "Yes — the full job tracker, interviews, CVs, calendar, and dashboard are free. AI features work with your own free API key (Groq or Gemini have free tiers)." },
            { q: "Do I need an AI key?", a: "No. Every AI feature falls back to useful rule-based logic, so the app is fully usable without any key. Add one when you want smarter results." },
            { q: "Is my data private?", a: "Your data lives in your own database. If you self-host, it never leaves your server, and AI calls only happen when you click a button — using your key." },
            { q: "Can I self-host it?", a: "Yes. It ships with a Docker setup (app + Postgres) and a deploy runbook for any VPS." },
          ].map((f) => (
            <div key={f.q} className="card p-6">
              <h3 className="font-medium text-zinc-900">{f.q}</h3>
              <p className="mt-1.5 text-sm text-zinc-500">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20">
        <div className="brand-gradient relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-6 py-16 text-center shadow-2xl shadow-violet-900/20">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-white">
            Start landing interviews, not losing track
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/80">
            Free to start. Set it up in a minute and track your very next application.
          </p>
          <div className="relative mt-8">
            <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-indigo-700 shadow-lg transition hover:bg-indigo-50">
              {authed ? "Go to your dashboard" : "Start free"} →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-400">
        CareerFlow OS — your AI-powered career command center.
      </footer>
    </div>
  );
}
