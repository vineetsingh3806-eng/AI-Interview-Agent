import type { QuestionRecord } from "@/types";

export function buildEvaluationPrompt(record: QuestionRecord): string {
  return `You are Aria, a rigorous senior AI engineer conducting a technical interview. Evaluate ONLY the candidate answer below. Do not be generous, do not use a default score, and do not infer knowledge that the candidate did not demonstrate.

QUESTION: ${record.question}
TOPIC: ${record.topic} | DAY: ${record.day} | TYPE: ${record.type} | DIFFICULTY: ${record.difficulty}
EXPECTED CONCEPTS: ${record.expectedConcepts.join(", ")}
CANDIDATE ANSWER: ${record.answer || "NO ANSWER / SKIPPED"}

Score 0-10 using evidence: 0=no answer; 1-2 mostly incorrect; 3-4 weak/major gaps; 5-6 partial/basic; 7-8 strong; 9-10 exceptional with depth, tradeoffs and practical reasoning.
Detect incorrect claims explicitly. A short irrelevant answer must score low.

Return ONLY JSON matching this shape:
{
  "score": 0,
  "correctConcepts": [],
  "missedConcepts": [],
  "incorrectConcepts": [],
  "strengths": [],
  "weaknesses": [],
  "needsFollowUp": false,
  "followUpDirection": "easier|deeper|challenge|none",
  "followUpQuestion": null,
  "feedback": "",
  "dimensions": {"technicalCorrectness":0,"communication":0,"confidence":0,"depth":0,"reasoning":0,"systemThinking":0,"practicalKnowledge":0}
}`;
}
