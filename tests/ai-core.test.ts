import { describe, it, expect } from "vitest";
import { runWithProviders } from "@/services/ai/core";
import type { AiAdapter } from "@/services/ai/types";

function fakeAdapter(text: string, fail = false): AiAdapter {
  return {
    provider: "GROQ",
    async run() {
      if (fail) throw new Error("provider down");
      return { text, tokensIn: 1, tokensOut: 2 };
    },
  };
}

describe("runWithProviders", () => {
  it("returns the first successful provider result", async () => {
    const res = await runWithProviders(
      [fakeAdapter("from-ai")],
      "prompt",
      () => "fallback"
    );
    expect(res.text).toBe("from-ai");
    expect(res.usedFallback).toBe(false);
  });

  it("skips a failing provider and uses the next", async () => {
    const res = await runWithProviders(
      [fakeAdapter("x", true), fakeAdapter("second")],
      "prompt",
      () => "fallback"
    );
    expect(res.text).toBe("second");
    expect(res.usedFallback).toBe(false);
  });

  it("uses rule-based fallback when all providers fail", async () => {
    const res = await runWithProviders(
      [fakeAdapter("x", true)],
      "prompt",
      () => "fallback-text"
    );
    expect(res.text).toBe("fallback-text");
    expect(res.usedFallback).toBe(true);
  });

  it("uses fallback when there are no providers", async () => {
    const res = await runWithProviders([], "prompt", () => "fb");
    expect(res.text).toBe("fb");
    expect(res.usedFallback).toBe(true);
  });
});
