export const PROVIDERS = ["CLAUDE", "OPENAI", "GROQ", "GEMINI", "OLLAMA"] as const;
export type ProviderName = (typeof PROVIDERS)[number];

export const AI_FEATURES = ["MATCH", "TAILOR", "PREP", "CHAT", "COMPANY"] as const;
export type FeatureName = (typeof AI_FEATURES)[number];

export interface AiResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

export interface AiAdapter {
  provider: ProviderName;
  run(prompt: string): Promise<AiResult>;
}
