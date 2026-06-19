import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { auth } from "@/auth";
import { doSignOut } from "./auth-actions";
import NotificationBell from "@/components/NotificationBell";
import MainNav from "@/components/MainNav";
import { getPlan } from "@/services/plan-service";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CareerFlow OS",
  description: "Your AI-powered career command center",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const plan = session?.user?.id ? await getPlan(session.user.id) : "FREE";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="aurora-bar" />
        <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-6">
            <a href="/" className="flex items-center gap-2">
              <span className="brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm shadow-violet-600/30">
                C
              </span>
              <span className="font-semibold tracking-tight">CareerFlow OS</span>
            </a>
            <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              beta
            </span>

            {session?.user ? (
              <>
                <MainNav />
                {plan === "PRO" ? (
                  <a href="/billing" className="ml-4 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                    PRO
                  </a>
                ) : (
                  <a href="/billing" className="ml-4 text-xs font-medium text-indigo-600 hover:underline">
                    Upgrade
                  </a>
                )}
                <div className="ml-3">
                  <NotificationBell />
                </div>
                <form action={doSignOut} className="ml-2 flex items-center gap-3">
                  <span className="text-xs text-zinc-400">{session.user.email}</span>
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-600">
                <a href="/login" className="hover:text-indigo-600">Sign in</a>
              </nav>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
