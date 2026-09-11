// ============================================================
// REPORT TYPES
// ============================================================

import type { Message } from "./interview";
import type { QuestionRecord } from "./question";

export type HiringRecommendation = "strong-hire" | "hire" | "borderline" | "no-hire";

export interface TopicScore {
  topic: string;
  day: number;
  score: number; // 0-100
  questionsAsked: number;
  questionsAnswered: number;
  coverage: "full" | "partial" | "minimal";
}

export interface EvaluationDimension {
  name: string;
  score: number; // 0-100
  description: string;
}

export interface FinalReport {
  sessionId: string;
  candidateId: string;
  generatedAt: string;
  totalDuration: number; // seconds
  overallScore: number; // 0-100
  topicScores: TopicScore[];
  dimensions: EvaluationDimension[];
  strengths: string[];
  weaknesses: string[];
  missedConcepts: string[];
  improvementPlan: string[];
  recommendedDays: number[];
  recommendedProjects: string[];
  hiringRecommendation: HiringRecommendation;
  hiringRationale: string;
  executiveSummary: string;
  transcript: Message[];
  questionHistory: QuestionRecord[];
}
