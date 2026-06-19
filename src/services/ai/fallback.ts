// Lightweight, dependency-free keyword analysis used when no AI is available.

const STOPWORDS = new Set([
  "the", "and", "a", "an", "to", "of", "in", "for", "with", "on", "at", "is",
  "are", "we", "you", "our", "your", "as", "be", "or", "this", "that", "will",
  "need", "needs", "looking", "experience", "experienced", "strong", "ability",
  "work", "team", "role", "years", "year", "plus", "etc", "including",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

export interface MatchResult {
  score: number; // 0..100
  missing: string[];
  matched: string[];
}

export function ruleBasedMatch(cvText: string, jobText: string): MatchResult {
  const cv = tokenize(cvText);
  const jd = tokenize(jobText);
  if (jd.size === 0 || cv.size === 0) return { score: 0, missing: [], matched: [] };

  const matched: string[] = [];
  const missing: string[] = [];
  Array.from(jd).forEach((term) => {
    if (cv.has(term)) matched.push(term);
    else missing.push(term);
  });
  const score = Math.round((matched.length / jd.size) * 100);
  // surface the most useful missing terms (longest first, capped)
  missing.sort((a, b) => b.length - a.length);
  return { score, missing: missing.slice(0, 12), matched };
}

const PREP_BANK: Record<string, string[]> = {
  PHONE: [
    "Tell me about yourself and why this role.",
    "What do you know about our company?",
    "What are your salary expectations?",
    "Why are you leaving your current role?",
  ],
  TECHNICAL: [
    "Walk me through a challenging technical problem you solved.",
    "How would you design a scalable version of a feature you built?",
    "Explain a trade-off you made between speed and quality.",
    "How do you test and debug your code?",
  ],
  ONSITE: [
    "Describe how you collaborate with cross-functional teams.",
    "Tell me about a conflict and how you resolved it.",
    "How do you prioritize competing deadlines?",
  ],
  HR: [
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 3 years?",
    "Describe your ideal work environment.",
  ],
  FINAL: [
    "Why should we hire you over other candidates?",
    "What questions do you have for us?",
    "What impact do you want to make in the first 90 days?",
  ],
};

export function genericPrepQuestions(type: string): string[] {
  return PREP_BANK[type] ?? PREP_BANK.PHONE;
}

export function companyBriefFallback(companyName: string): string {
  const c = companyName || "this company";
  return [
    `No AI key configured — here is a research checklist for ${c}:`,
    "",
    "Overview: visit their website + LinkedIn. What do they sell, who are their customers, how big are they?",
    "Recent news: search Google News + their blog for the last 3 months.",
    "Likely interview questions: review the job description and Glassdoor interview reviews for this company.",
    "Smart questions to ask them: team structure, success in 6 months, biggest current challenge, growth plans.",
    "Talking points: connect your experience to their product and a recent company milestone.",
  ].join("\n");
}
