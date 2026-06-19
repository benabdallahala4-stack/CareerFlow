"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/board", label: "Board" },
  { href: "/calendar", label: "Calendar" },
  { href: "/cvs", label: "CVs" },
  { href: "/assistant", label: "Assistant" },
  { href: "/settings", label: "Settings" },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="ml-auto flex items-center gap-1 text-sm">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 transition ${
              active
                ? "bg-indigo-50 font-medium text-indigo-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
