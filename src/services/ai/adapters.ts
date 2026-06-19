import type { AiAdapter, AiResult, ProviderName } from "./types";

const DEFAULT_MODELS: Record<ProviderName, string> = {
  CLAUDE: "claude-haiku-4-5-20251001",
  OPENAI: "gpt-4o-mini",
  GROQ: "llama-3.3-70b-versatile",
  GEMINI: "gemini-1.5-flash",
  OLLAMA: "llama3.1",
};

// OpenAI + Groq share the OpenAI chat-completions shape.
function openAiCompatible(
  provider: ProviderName,
  baseUrl: string,
  apiKey: string,
  model: string
): AiAdapter {
  return {
    provider,
    async run(prompt: string): Promise<AiResult> {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });
      if (!res.ok) throw new Error(`${provider} ${res.status}`);
      const data = await res.json();
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        tokensIn: data.usage?.prompt_tokens ?? 0,
        tokensOut: data.usage?.completion_tokens ?? 0,
      };
    },
  };
}

function claudeAdapter(apiKey: string, model: string): AiAdapter {
  return {
    provider: "CLAUDE",
    async run(prompt: string): Promise<AiResult> {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`CLAUDE ${res.status}`);
      const data = await res.json();
      return {
        text: data.content?.[0]?.text ?? "",
        tokensIn: data.usage?.input_tokens ?? 0,
        tokensOut: data.usage?.output_tokens ?? 0,
      };
    },
  };
}

function geminiAdapter(apiKey: string, model: string): AiAdapter {
  return {
    provider: "GEMINI",
    async run(prompt: string): Promise<AiResult> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (!res.ok) throw new Error(`GEMINI ${res.status}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const usage = data.usageMetadata ?? {};
      return {
        text,
        tokensIn: usage.promptTokenCount ?? 0,
        tokensOut: usage.candidatesTokenCount ?? 0,
      };
    },
  };
}

function ollamaAdapter(model: string): AiAdapter {
  return {
    provider: "OLLAMA",
    async run(prompt: string): Promise<AiResult> {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
      });
      if (!res.ok) throw new Error(`OLLAMA ${res.status}`);
      const data = await res.json();
      return {
        text: data.response ?? "",
        tokensIn: data.prompt_eval_count ?? 0,
        tokensOut: data.eval_count ?? 0,
      };
    },
  };
}

export function buildAdapter(
  provider: ProviderName,
  apiKey: string | null,
  model: string | null
): AiAdapter {
  const m = model || DEFAULT_MODELS[provider];
  const key = apiKey ?? "";
  switch (provider) {
    case "OPENAI":
      return openAiCompatible("OPENAI", "https://api.openai.com/v1", key, m);
    case "GROQ":
      return openAiCompatible("GROQ", "https://api.groq.com/openai/v1", key, m);
    case "CLAUDE":
      return claudeAdapter(key, m);
    case "GEMINI":
      return geminiAdapter(key, m);
    case "OLLAMA":
      return ollamaAdapter(m);
  }
}
