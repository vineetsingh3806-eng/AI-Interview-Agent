// ============================================================
// INTERVIEW SESSION TYPES
// ============================================================

import type { QuestionRecord, AnswerEvaluation, DifficultyLevel } from "./question";

export type InterviewStatus = "idle" | "active" | "paused" | "completed";

export type MessageRole = "interviewer" | "candidate" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  questionIndex?: number;
  isFollowUp?: boolean;
  isThinking?: boolean;
  metadata?: {
    topic?: string;
    difficulty?: DifficultyLevel;
    questionType?: string;
  };
}

export interface InterviewMemory {
  coveredTopics: string[];
  coveredDays: number[];
  strongAreas: string[];
  weakAreas: string[];
  askedQuestionIds: string[];
  answerHistory: {
    question: string;
    answer: string;
    score: number;
    topic: string;
  }[];
  overallSentiment: "positive" | "neutral" | "negative";
  lastDifficultyAdjustment?: string;
}

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  candidateName?: string;
  targetSkill?: string;
  interviewLevel?: DifficultyLevel;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  status: InterviewStatus;
  currentQuestionIndex: number;
  difficulty: DifficultyLevel;
  currentTopic: string;
  messages: Message[];
  questionHistory: QuestionRecord[];
  memory: InterviewMemory;
  totalDuration?: number; // seconds
}

export interface StartInterviewRequest {
  candidateId: string;
  candidateName?: string;
  targetSkill?: string;
  interviewLevel?: DifficultyLevel;
}

export interface StartInterviewResponse {
  sessionId: string;
  firstMessage: Message;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}

export interface SendMessageResponse {
  message: Message;
  evaluation?: AnswerEvaluation;
  nextQuestion?: Message;
  isComplete: boolean;
}
