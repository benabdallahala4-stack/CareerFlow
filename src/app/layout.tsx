import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-6">
            <a href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
                C
              </span>
              <span className="font-semibold tracking-tight">CareerFlow OS</span>
            </a>
            <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              beta
            </span>
            <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-600">
              <a href="/" className="hover:text-indigo-600">Board</a>
              <a href="/cvs" className="hover:text-indigo-600">CVs</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
