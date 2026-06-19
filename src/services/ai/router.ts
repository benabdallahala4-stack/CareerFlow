import { db } from "@/lib/db";
import { activeProvidersByPriority } from "../ai-setting-service";
import { getEntitlements } from "../plan-service";
import { shouldUseManagedAi } from "@/lib/entitlements";
import { buildAdapter } from "./adapters";
import { runWithProviders, type RunOutcome } from "./core";
import type { FeatureName, ProviderName } from "./types";

/**
 * Run a feature prompt through the user's configured providers (priority order),
 * falling back to the supplied rule-based text. Logs usage. Never throws.
 */
export async function runFeature(
  userId: string,
  feature: FeatureName,
  prompt: string,
  fallback: () => string
): Promise<RunOutcome> {
  const settings = await activeProvidersByPriority(userId);
  const adapters = settings.map((s) =>
    buildAdapter(s.provider as ProviderName, s.apiKey, s.model)
  );

  // Pro users with no own key get managed AI when the server provides a key.
  const managedKey = process.env.MANAGED_AI_KEY;
  const ent = await getEntitlements(userId);
  if (shouldUseManagedAi(ent, adapters.length > 0, Boolean(managedKey))) {
    adapters.push(
      buildAdapter(
        (process.env.MANAGED_AI_PROVIDER as ProviderName) ?? "GROQ",
        managedKey ?? null,
        process.env.MANAGED_AI_MODEL ?? null
      )
    );
  }

  const outcome = await runWithProviders(adapters, prompt, fallback);

  if (!outcome.usedFallback && outcome.provider) {
    await db.aiUsageLog.create({
      data: {
        userId,
        provider: outcome.provider,
        feature,
        tokensIn: outcome.tokensIn,
        tokensOut: outcome.tokensOut,
      },
    });
  }

  return outcome;
}
