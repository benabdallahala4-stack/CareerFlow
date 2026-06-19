import type { AiAdapter, ProviderName } from "./types";

export interface RunOutcome {
  text: string;
  tokensIn: number;
  tokensOut: number;
  usedFallback: boolean;
  provider: ProviderName | null;
}

/**
 * Try each adapter in order. Return the first success. If all throw (or the
 * list is empty), return the rule-based fallback text. Never throws.
 */
export async function runWithProviders(
  adapters: AiAdapter[],
  prompt: string,
  fallback: () => string
): Promise<RunOutcome> {
  for (const adapter of adapters) {
    try {
      const r = await adapter.run(prompt);
      return {
        text: r.text,
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        usedFallback: false,
        provider: adapter.provider,
      };
    } catch {
      // try next provider
    }
  }
  return {
    text: fallback(),
    tokensIn: 0,
    tokensOut: 0,
    usedFallback: true,
    provider: null,
  };
}
