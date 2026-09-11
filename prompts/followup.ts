// ============================================================
// FOLLOW-UP PROMPT
// Generates contextual follow-up questions
// ============================================================

import type { AnswerEvaluation, QuestionRecord } from "@/types";

export function buildFollowUpPrompt(
  record: QuestionRecord,
  evaluation: AnswerEvaluation
): string {
  const directionGuide = {
    deeper: `The candidate answered well. Go DEEPER. Ask about advanced implications, edge cases, or real-world system design considerations related to this topic.`,
    easier: `The candidate struggled. Ask an EASIER version to find their baseline. Simplify the concept, use an analogy prompt, or ask them to explain just the definition.`,
    challenge: `The candidate stated something INCORRECT: ${evaluation.incorrectConcepts.join(", ")}. Politely but directly challenge this. Ask them to reconsider or explain their reasoning.`,
    none: "",
  };

  return `You are Aria, a senior AI technical interviewer. Generate ONE natural, conversational follow-up question.

## Context
Original Question: "${record.question}"
Candidate's Answer: "${record.answer}"
Evaluation Score: ${evaluation.score}/10
Direction: ${evaluation.followUpDirection.toUpperCase()}

## Instruction
${directionGuide[evaluation.followUpDirection as keyof typeof directionGuide] || ""}

## Rules
- ONE question only
- Conversational tone — as if naturally continuing the discussion
- Don't say "follow-up question" or number it
- Don't repeat the original question
- Keep it focused and specific
- Natural transition phrase is fine (e.g., "Interesting — so when you mention X, how would you...")

Return ONLY the follow-up question text. No JSON, no labels, no explanation.`;
}
