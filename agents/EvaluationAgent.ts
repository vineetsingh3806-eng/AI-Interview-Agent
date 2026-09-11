import { geminiChat, parseJsonFromLLM } from "@/lib/gemini";
import { buildEvaluationPrompt } from "@/prompts/evaluation";
import type { QuestionRecord, AnswerEvaluation } from "@/types";

const clamp10 = (n: unknown) => Math.max(0, Math.min(10, Number(n) || 0));

const localFallback = (record: QuestionRecord): AnswerEvaluation => {
  const answer = (record.answer || "").trim();
  const normalized = answer.toLowerCase();
  const skipped = record.skipped || !answer || /^(skip|pass|idk|i ?don'?t know|not sure|no idea)([.! ]|$)/i.test(normalized);
  if (skipped) return {
    score: 0, correctConcepts: [], missedConcepts: record.expectedConcepts, incorrectConcepts: [],
    strengths: [], weaknesses: ["No technical evidence was provided."], needsFollowUp: false,
    followUpDirection: "none", feedback: "No technical answer was demonstrated, so this area is recorded as a gap."
  };
  const words = answer.split(/\s+/).filter(Boolean).length;
  const conceptHits = record.expectedConcepts.filter(c => normalized.includes(c.toLowerCase().split(" ")[0])).length;
  const reasoningSignals = ["because", "therefore", "tradeoff", "latency", "scale", "example", "production", "however", "why"].filter(x => normalized.includes(x)).length;
  const incorrectSignals = ["always", "never", "100%", "no downside"].filter(x => normalized.includes(x)).length;
  const score = clamp10(Math.round(Math.min(10, 2 + Math.min(4, words / 35) + conceptHits * 0.7 + reasoningSignals * 0.35 - incorrectSignals * 0.9)));
  return {
    score, correctConcepts: record.expectedConcepts.slice(0, Math.min(conceptHits, 4)),
    missedConcepts: record.expectedConcepts.slice(Math.min(conceptHits, 2)),
    incorrectConcepts: incorrectSignals ? ["Contains an absolute claim that needs qualification."] : [],
    strengths: words > 45 ? ["Explained the idea with useful detail."] : ["Provided an attempt relevant to the question."],
    weaknesses: score < 5 ? ["Needs more technical depth and precision."] : score < 8 ? ["Could strengthen the answer with trade-offs or concrete examples."] : [],
    needsFollowUp: score >= 7 || score <= 4 || incorrectSignals > 0,
    followUpDirection: incorrectSignals ? "challenge" : score >= 7 ? "deeper" : score <= 4 ? "easier" : "none",
    feedback: score >= 8 ? "The answer shows solid technical understanding. A deeper production trade-off would make it stronger." : score >= 5 ? "The answer shows partial understanding. Add precise mechanisms and an example to strengthen it." : "The answer needs clearer fundamentals and more precise reasoning."
  };
};

export class EvaluationAgent {
  async evaluate(record: QuestionRecord): Promise<AnswerEvaluation> {
    try {
      const raw = await geminiChat([{ role: "user", content: buildEvaluationPrompt(record) }], { temperature: 0.15, max_tokens: 420, timeoutMs: 18000 });
      const e = parseJsonFromLLM<AnswerEvaluation>(raw);
      e.score = clamp10(e.score);
      e.correctConcepts ??= []; e.missedConcepts ??= record.expectedConcepts; e.incorrectConcepts ??= [];
      e.strengths ??= []; e.weaknesses ??= []; e.feedback ??= "Evaluation completed.";
      e.needsFollowUp = Boolean(e.needsFollowUp); e.followUpDirection ??= "none";
      return e;
    } catch (error) {
      console.warn("[EvaluationAgent] Ollama unavailable; deterministic fallback used:", error);
      return localFallback(record);
    }
  }

  async generateFollowUp(record: QuestionRecord, evaluation: AnswerEvaluation): Promise<string> {
    if (evaluation.followUpQuestion?.trim()) return evaluation.followUpQuestion.trim();
    if (evaluation.followUpDirection === "deeper") return `You have the core idea. Now take it one level deeper: what would change when this has to work reliably at production scale?`;
    if (evaluation.followUpDirection === "easier") return `Let's simplify it. Can you explain the same idea with a small, concrete example?`;
    if (evaluation.followUpDirection === "challenge") return `I want to challenge one assumption in that answer. What evidence or mechanism would make your approach correct, and what is the edge case?`;
    return `Give me one practical example of when you would choose this approach.`;
  }
}
