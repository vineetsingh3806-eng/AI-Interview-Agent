// ============================================================
// CANDIDATE TYPES
// ============================================================

export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  role: string;
  cohort: string;
  completedDays: number[];
  skippedDays: number[];
  weakTopics: string[];
  strongTopics: string[];
  confidenceLevel: number; // 0-100
  overallProgress: number; // 0-100
  joinedAt: string;
  bio: string;
}
