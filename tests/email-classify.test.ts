import { describe, it, expect } from "vitest";
import { classifyEmail, proposedStatusFor } from "@/services/email/classify";

describe("classifyEmail", () => {
  it("detects an interview invite", () => {
    expect(classifyEmail("Next steps", "We'd love to schedule a call to meet the team.")).toBe("INTERVIEW");
  });
  it("detects a rejection", () => {
    expect(classifyEmail("Your application", "Unfortunately we will not be moving forward.")).toBe("REJECTION");
  });
  it("detects an offer", () => {
    expect(classifyEmail("Great news", "We are pleased to offer you the position.")).toBe("OFFER");
  });
  it("falls back to OTHER", () => {
    expect(classifyEmail("Newsletter", "Here are this week's updates.")).toBe("OTHER");
  });
  it("prefers rejection over interview when both present", () => {
    expect(classifyEmail("Interview update", "Thanks for the interview. Unfortunately, not moving forward.")).toBe("REJECTION");
  });
  it("maps classes to proposed status", () => {
    expect(proposedStatusFor("INTERVIEW")).toBe("INTERVIEW");
    expect(proposedStatusFor("REJECTION")).toBe("REJECTED");
    expect(proposedStatusFor("OFFER")).toBe("OFFER");
    expect(proposedStatusFor("OTHER")).toBe(null);
  });
});
