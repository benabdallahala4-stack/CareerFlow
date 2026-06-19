import { describe, it, expect } from "vitest";
import { ruleBasedMatch, genericPrepQuestions, companyBriefFallback } from "@/services/ai/fallback";

describe("ruleBasedMatch", () => {
  it("scores keyword overlap and lists missing terms", () => {
    const cv = "Experienced Node.js and TypeScript developer with React";
    const jd = "We need a TypeScript engineer with React and GraphQL and AWS";
    const r = ruleBasedMatch(cv, jd);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.missing.map((m) => m.toLowerCase())).toContain("graphql");
    expect(r.missing.map((m) => m.toLowerCase())).toContain("aws");
  });

  it("returns 0 with empty inputs", () => {
    expect(ruleBasedMatch("", "").score).toBe(0);
  });
});

describe("genericPrepQuestions", () => {
  it("returns role-relevant questions for a type", () => {
    const qs = genericPrepQuestions("TECHNICAL");
    expect(qs.length).toBeGreaterThan(2);
    expect(typeof qs[0]).toBe("string");
  });
});

describe("companyBriefFallback", () => {
  it("returns a checklist covering the four research areas", () => {
    const t = companyBriefFallback("Acme");
    expect(t).toContain("Acme");
    expect(t.toLowerCase()).toContain("overview");
    expect(t.toLowerCase()).toContain("questions to ask");
  });
});
