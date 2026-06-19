import Link from "next/link";
import { auth } from "@/auth";
import { unreadCount } from "@/services/notification-service";

export default async function NotificationBell() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const count = await unreadCount(session.user.id);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
      aria-label="Notifications"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
