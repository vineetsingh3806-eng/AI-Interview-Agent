// ============================================================
// INTERVIEWER PROMPT
// Generates the next question based on session context
// ============================================================

import type { InterviewSession, Candidate } from "@/types";

export function buildInterviewerPrompt(
  session: InterviewSession,
  candidate: Candidate,
  curriculumContext: string
): string {
  const askedTopics = session.questionHistory.map((q) => q.topic);
  const askedDays = Array.from(new Set(session.questionHistory.map((q) => q.day)));
  const recentScores = session.questionHistory
    .slice(-3)
    .map((q) => q.score ?? 0);
  const avgRecentScore =
    recentScores.length > 0
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : 5;

  const difficultyInstruction =
    avgRecentScore >= 7
      ? "Increase difficulty — the candidate is performing well. Ask intermediate or advanced questions."
      : avgRecentScore <= 3
      ? "Decrease difficulty — find the candidate's baseline. Ask beginner-level questions."
      : "Maintain current difficulty level.";

  const weakAreasInstruction =
    candidate.weakTopics.length > 0
      ? `Prioritize questions on weak topics: ${candidate.weakTopics.join(", ")}`
      : "Balance questions across covered days.";

  return `You are Aria, generating the next interview question. Return ONLY valid JSON.

## Session State
Questions Asked So Far: ${session.currentQuestionIndex}
Days Already Covered: ${askedDays.join(", ") || "None yet"}
Topics Asked: ${askedTopics.join(", ") || "None yet"}
Current Difficulty: ${session.difficulty}
Recent Performance (avg last 3 questions): ${avgRecentScore.toFixed(1)}/10

## Difficulty Instruction
${difficultyInstruction}

## Topic Priority
${weakAreasInstruction}

## Available Curriculum
${curriculumContext}

## Candidate's Completed Days
${candidate.completedDays.join(", ")}

## Rules
- Pick a topic the candidate HAS covered (completed days only)
- Do NOT repeat any already-asked topic unless all topics are exhausted
- If fewer than 4 days are covered, ensure you pick from an uncovered day
- Mix question types — don't ask 3 conceptual questions in a row
- The question should feel natural and conversational

Return EXACTLY this JSON:
{
  "question": "<the interview question — conversational, one focused question>",
  "topic": "<specific topic name>",
  "day": <day number>,
  "type": "<conceptual|scenario|architecture|system-design|debugging|tradeoffs|best-practices>",
  "difficulty": "<beginner|intermediate|advanced>",
  "expectedConcepts": [<3-6 key concepts a good answer should include>],
  "transition": "<1-2 sentence natural transition phrase to use before asking this question (e.g., 'Great, let's explore a different area...')>"
}

Return ONLY the JSON. No markdown, no explanation.`;
}
