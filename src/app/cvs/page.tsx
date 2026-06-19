import { listCvs } from "@/services/cv-service";
import CvManager from "@/components/CvManager";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function CvsPage() {
  const userId = await requireUserId();
  const cvs = await listCvs(userId);
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        CV Manager
      </h1>
      <CvManager
        cvs={cvs.map((c) => ({
          id: c.id,
          label: c.label,
          isDefault: c.isDefault,
          hasFile: Boolean(c.filePath),
          hasContent: Boolean(c.content),
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
