// ============================================================
// QUESTION TYPES
// ============================================================

export type QuestionType =
  | "conceptual"
  | "scenario"
  | "architecture"
  | "system-design"
  | "debugging"
  | "tradeoffs"
  | "best-practices";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Question {
  id: string;
  question: string;
  topic: string;
  day: number;
  type: QuestionType;
  difficulty: DifficultyLevel;
  expectedConcepts: string[];
  followUpHints?: string[];
}

export interface QuestionRecord extends Question {
  answer?: string;
  score?: number;
  evaluation?: AnswerEvaluation;
  followUpCount: number;
  askedAt: string;
  answeredAt?: string;
  skipped: boolean;
}

export interface AnswerEvaluation {
  score: number; // 0-10
  dimensions?: {
    technicalCorrectness: number;
    communication: number;
    confidence: number;
    depth: number;
    reasoning: number;
    systemThinking: number;
    practicalKnowledge: number;
  };
  correctConcepts: string[];
  missedConcepts: string[];
  incorrectConcepts: string[];
  strengths: string[];
  weaknesses: string[];
  needsFollowUp: boolean;
  followUpDirection: "easier" | "deeper" | "challenge" | "none";
  followUpQuestion?: string;
  feedback: string;
}
