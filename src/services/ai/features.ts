import { runFeature } from "./router";
import { ruleBasedMatch, genericPrepQuestions, companyBriefFallback } from "./fallback";

export interface MatchOutput {
  raw: string;
  usedFallback: boolean;
  score: number | null;
  missing: string[];
}

export async function matchScore(
  userId: string,
  cv: string,
  jobDescription: string
): Promise<MatchOutput> {
  const rb = ruleBasedMatch(cv, jobDescription);
  const prompt = `You are an ATS expert. Given this CV and job description, reply with a single line "SCORE: <0-100>" then a short bullet list of the most important missing keywords/skills.\n\n=== CV ===\n${cv}\n\n=== JOB ===\n${jobDescription}`;

  const outcome = await runFeature(userId, "MATCH", prompt, () =>
    `SCORE: ${rb.score}\nMissing: ${rb.missing.join(", ") || "none detected"}`
  );

  const m = outcome.text.match(/SCORE:\s*(\d{1,3})/i);
  const score = m ? Math.min(100, parseInt(m[1], 10)) : rb.score;

  return {
    raw: outcome.text,
    usedFallback: outcome.usedFallback,
    score,
    missing: rb.missing,
  };
}

export interface TextOutput {
  text: string;
  usedFallback: boolean;
}

export async function tailorCv(
  userId: string,
  cv: string,
  jobDescription: string
): Promise<TextOutput> {
  const prompt = `Rewrite/suggest 5-8 improved resume bullet points to better match this job. Be specific and ATS-friendly.\n\n=== CV ===\n${cv}\n\n=== JOB ===\n${jobDescription}`;
  const outcome = await runFeature(userId, "TAILOR", prompt, () =>
    "Add a free Groq or Gemini API key in Settings to unlock AI tailoring. Meanwhile, mirror the exact keywords from the job description in your bullet points and lead each with a measurable result."
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}

export async function interviewPrep(
  userId: string,
  role: string,
  cv: string,
  interviewType: string
): Promise<TextOutput> {
  const prompt = `Generate 6 likely ${interviewType} interview questions for the role "${role}", plus a one-line prep tip each. Use the candidate CV for relevance.\n\n=== CV ===\n${cv}`;
  const outcome = await runFeature(userId, "PREP", prompt, () =>
    genericPrepQuestions(interviewType).map((q, i) => `${i + 1}. ${q}`).join("\n")
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}

export async function companyBrief(
  userId: string,
  companyName: string,
  website: string | null,
  role: string
): Promise<TextOutput> {
  const prompt =
    `Write a concise interview-prep brief for a candidate interviewing at "${companyName}"${
      website ? ` (${website})` : ""
    } for the role "${role}". Use exactly these four sections with headers:\n` +
    `1. Overview — what the company does.\n` +
    `2. Likely interview questions.\n` +
    `3. Smart questions to ask them.\n` +
    `4. Talking points / why this company.\n` +
    `Base it on general knowledge; if unsure about recent facts, say so.`;
  const outcome = await runFeature(userId, "COMPANY", prompt, () =>
    companyBriefFallback(companyName)
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}

export async function careerChat(
  userId: string,
  history: string,
  cvContext: string
): Promise<TextOutput> {
  const prompt = `You are a concise career assistant. Use the candidate context to answer the latest message helpfully.\n\n=== CONTEXT ===\n${cvContext}\n\n=== CONVERSATION ===\n${history}`;
  const outcome = await runFeature(userId, "CHAT", prompt, () =>
    "Add a free Groq or Gemini API key in Settings to chat with your AI career assistant. Until then, focus on tailoring each application and following up after 7 days of silence."
  );
  return { text: outcome.text, usedFallback: outcome.usedFallback };
}
