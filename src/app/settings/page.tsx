import { listAiSettings } from "@/services/ai-setting-service";
import AiSettingsManager from "@/components/AiSettingsManager";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const settings = await listAiSettings(userId);
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-zinc-900">
        AI Settings
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Connect your own AI provider. Everything works without one — AI just makes it better.
      </p>
      <AiSettingsManager
        settings={settings.map((s) => ({
          id: s.id,
          provider: s.provider,
          model: s.model,
          isActive: s.isActive,
          priority: s.priority,
          hasKey: Boolean(s.apiKey),
        }))}
      />
    </main>
  );
}
