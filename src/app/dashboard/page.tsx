import { redirect } from "next/navigation";

// The dashboard was merged into /home. Keep this route as a redirect so any
// existing links/bookmarks still work.
export default function DashboardPage() {
  redirect("/home");
}
