import { db } from "@/lib/db";
import { activeProvidersByPriority } from "../ai-setting-service";
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
