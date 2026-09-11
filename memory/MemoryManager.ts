// ============================================================
// MEMORY MANAGER
// Tracks interview context, prevents repetition, adjusts difficulty
// ============================================================

import type { InterviewSession, DifficultyLevel } from "@/types";

export class MemoryManager {
  constructor(private session: InterviewSession) {}

  // Snapshot of current memory state as a readable string
  getContextSummary(): string {
    const mem = this.session.memory;
    return [
      `Covered topics: ${mem.coveredTopics.join(", ") || "none"}`,
      `Strong areas: ${mem.strongAreas.join(", ") || "none identified"}`,
      `Weak areas: ${mem.weakAreas.join(", ") || "none identified"}`,
      `Days covered: ${mem.coveredDays.join(", ") || "none"}`,
      `Questions asked: ${mem.askedQuestionIds.length}`,
    ].join("\n");
  }

  // Dynamically compute next difficulty based on recent performance
  computeNextDifficulty(): DifficultyLevel {
    const history = this.session.memory.answerHistory;
    if (history.length < 2) return this.session.difficulty;

    const recent = history.slice(-3);
    const avg = recent.reduce((s, h) => s + h.score, 0) / recent.length;

    if (avg >= 7.5) return "advanced";
    if (avg >= 5) return "intermediate";
    return "beginner";
  }

  // Update memory after an answer is evaluated
  updateAfterAnswer(
    topic: string,
    day: number,
    score: number,
    questionId: string
  ): void {
    const mem = this.session.memory;

    if (!mem.coveredTopics.includes(topic)) mem.coveredTopics.push(topic);
    if (!mem.coveredDays.includes(day)) mem.coveredDays.push(day);
    if (!mem.askedQuestionIds.includes(questionId)) mem.askedQuestionIds.push(questionId);

    // Classify as strong or weak
    if (score >= 7) {
      if (!mem.strongAreas.includes(topic)) mem.strongAreas.push(topic);
      mem.weakAreas = mem.weakAreas.filter((a) => a !== topic);
    } else if (score <= 4) {
      if (!mem.weakAreas.includes(topic)) mem.weakAreas.push(topic);
    }

    // Update overall sentiment
    const recentScores = mem.answerHistory.slice(-5).map((h) => h.score);
    const avg = recentScores.reduce((a, b) => a + b, 0) / (recentScores.length || 1);
    if (avg >= 7) mem.overallSentiment = "positive";
    else if (avg >= 4) mem.overallSentiment = "neutral";
    else mem.overallSentiment = "negative";
  }

  addAnswerToHistory(
    question: string,
    answer: string,
    score: number,
    topic: string
  ): void {
    this.session.memory.answerHistory.push({ question, answer, score, topic });
  }

  hasAsked(questionId: string): boolean {
    return this.session.memory.askedQuestionIds.includes(questionId);
  }

  getSession(): InterviewSession {
    return this.session;
  }
}
