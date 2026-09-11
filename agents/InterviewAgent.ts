import { loadSession, saveSession } from "@/lib/session";
import { MemoryManager } from "@/memory/MemoryManager";
import { EvaluationAgent } from "./EvaluationAgent";
import { QuestionStrategist } from "./QuestionStrategist";
import { FeedbackAgent } from "./FeedbackAgent";
import type {
  InterviewSession,
  Candidate,
  Message,
  QuestionRecord,
} from "@/types";
import { generateId, timestampNow } from "@/lib/utils";
import candidatesData from "@/data/candidates.json";

const MAX_QUESTIONS = 12;
const MIN_QUESTIONS = 8;

const isSkip = (a: string) =>
  /^(skip|pass|idk|i ?don'?t know|not sure|no idea)([.! ,]|$)/i.test(
    a.trim()
  ) || a.trim().length < 2;

const reactions = (score: number, dir: string) => {
  if (dir === "challenge")
    return "There is one assumption I want to challenge. Let's examine it carefully.";

  if (dir === "deeper" || score >= 8)
    return "That's a strong explanation. Let's take it one level deeper.";

  if (dir === "easier" || score <= 3)
    return "I see the direction you're taking. Let's simplify it and test the fundamentals.";

  if (score <= 5)
    return "You're on the right track. Let's test the same idea from another angle.";

  return "Good. Let's build on that reasoning.";
};

export class InterviewAgent {
  private evaluationAgent = new EvaluationAgent();
  private questionStrategist = new QuestionStrategist();
  private feedbackAgent = new FeedbackAgent();

  private getCandidate(id: string): Candidate {
    const c = (candidatesData as Candidate[]).find((x) => x.id === id);

    if (!c) {
      throw new Error(`Candidate ${id} not found`);
    }

    return c;
  }

  async startInterview(
    candidateId: string,
    candidateName?: string,
    targetSkill?: string,
    interviewLevel?: "beginner" | "intermediate" | "advanced"
  ): Promise<{
    session: InterviewSession;
    firstMessage: Message;
  }> {
    const candidate = this.getCandidate(candidateId);

    const displayName = candidateName?.trim() || candidate.name;

    const selectedInterviewLevel =
      interviewLevel ||
      (candidate.confidenceLevel >= 75
        ? "advanced"
        : candidate.confidenceLevel >= 55
        ? "intermediate"
        : "beginner");

    const session: InterviewSession = {
      sessionId: generateId(),
      candidateId,
      candidateName: displayName,
      targetSkill: targetSkill?.trim() || undefined,
      interviewLevel: selectedInterviewLevel,
      startedAt: timestampNow(),
      updatedAt: timestampNow(),
      status: "active",
      currentQuestionIndex: 0,
      difficulty: selectedInterviewLevel,
      currentTopic: "",
      messages: [],
      questionHistory: [],
      memory: {
        coveredTopics: [],
        coveredDays: [],
        strongAreas: [...candidate.strongTopics],
        weakAreas: [...candidate.weakTopics],
        askedQuestionIds: [],
        answerHistory: [],
        overallSentiment: "neutral",
      },
    };

    const q = this.questionStrategist.generateNextQuestion(
      session,
      candidate
    );

    const record = this.questionStrategist.buildQuestionRecord(
      q,
      session
    ) as QuestionRecord;

    session.questionHistory.push(record);
    session.currentTopic = q.topic;
    session.difficulty = q.difficulty;
    session.currentQuestionIndex = 1;

    const first: Message = {
      id: generateId(),
      role: "interviewer",
      content: `Hi ${
        displayName.split(" ")[0]
      }, welcome to your ABTalks technical interview. I’ll adapt the discussion to your learning journey. ${
        q.question
      }`,
      timestamp: timestampNow(),
      questionIndex: 1,
      metadata: {
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.type,
      },
    };

    session.messages.push(first);

    saveSession(session);

    return {
      session,
      firstMessage: first,
    };
  }

  async processAnswer(
    sessionId: string,
    answer: string,
    sessionState?: InterviewSession
  ) {
    /*
     * IMPORTANT FOR VERCEL:
     *
     * If the browser sends the latest session state, use that state first.
     * Do NOT depend only on /tmp session files because Vercel serverless
     * requests can run on different instances.
     */
    const session =
      sessionState && sessionState.sessionId === sessionId
        ? sessionState
        : loadSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status === "completed") {
      throw new Error("Interview is already completed");
    }

    const candidate = this.getCandidate(session.candidateId);

    const memory = new MemoryManager(session);

    const current =
      session.questionHistory[session.questionHistory.length - 1];

    if (!current) {
      throw new Error("No active question found");
    }

    const clean = answer.trim();
    const skipped = isSkip(clean);

    session.messages.push({
      id: generateId(),
      role: "candidate",
      content: clean,
      timestamp: timestampNow(),
      questionIndex: session.currentQuestionIndex,
    });

    current.answer = clean;
    current.answeredAt = timestampNow();
    current.skipped = skipped;

    const evaluation = await this.evaluationAgent.evaluate(current);

    current.score = skipped ? 0 : evaluation.score;
    current.evaluation = evaluation;

    memory.updateAfterAnswer(
      current.topic,
      current.day,
      current.score,
      current.id
    );

    memory.addAnswerToHistory(
      current.question,
      clean,
      current.score,
      current.topic
    );

    const adaptiveDifficulty = memory.computeNextDifficulty();

    const levelOrder = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
    } as const;

    const selectedLevel = session.interviewLevel || session.difficulty;

    session.difficulty =
      levelOrder[adaptiveDifficulty] > levelOrder[selectedLevel]
        ? selectedLevel
        : adaptiveDifficulty;

    session.updatedAt = timestampNow();

    const complete =
      session.currentQuestionIndex >= MAX_QUESTIONS ||
      (session.currentQuestionIndex >= MIN_QUESTIONS &&
        session.memory.coveredDays.length >= 4);

    if (complete) {
      session.status = "completed";
      session.completedAt = timestampNow();

      session.totalDuration = Math.round(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      );

      const next: Message = {
        id: generateId(),
        role: "interviewer",
        content: `That brings us to the end of the interview, ${
          session.candidateName?.split(" ")[0] ||
          candidate.name.split(" ")[0]
        }. I’ve captured your performance across the curriculum. Your report is ready.`,
        timestamp: timestampNow(),
        questionIndex: session.currentQuestionIndex,
      };

      session.messages.push(next);

      saveSession(session);

      return {
        evaluation,
        nextMessage: next,
        updatedSession: session,
        isComplete: true,
      };
    }

    if (
      !skipped &&
      evaluation.needsFollowUp &&
      current.followUpCount < 1
    ) {
      const fq = await this.evaluationAgent.generateFollowUp(
        current,
        evaluation
      );

      current.followUpCount += 1;

      const follow: QuestionRecord = {
        ...current,
        id: generateId(),
        question: fq,
        answer: undefined,
        score: undefined,
        evaluation: undefined,
        followUpCount: 0,
        askedAt: timestampNow(),
        answeredAt: undefined,
        skipped: false,
      };

      session.questionHistory.push(follow);
      session.currentQuestionIndex += 1;
      session.currentTopic = follow.topic;

      const next: Message = {
        id: generateId(),
        role: "interviewer",
        content: `${reactions(
          evaluation.score,
          evaluation.followUpDirection
        )} ${fq}`,
        timestamp: timestampNow(),
        questionIndex: session.currentQuestionIndex,
        isFollowUp: true,
        metadata: {
          topic: follow.topic,
          difficulty: session.difficulty,
          questionType: follow.type,
        },
      };

      session.messages.push(next);

      saveSession(session);

      return {
        evaluation,
        nextMessage: next,
        updatedSession: session,
        isComplete: false,
      };
    }

    const q = this.questionStrategist.generateNextQuestion(
      session,
      candidate
    );

    const nextRecord = this.questionStrategist.buildQuestionRecord(
      q,
      session
    ) as QuestionRecord;

    session.questionHistory.push(nextRecord);

    session.currentQuestionIndex += 1;
    session.currentTopic = q.topic;
    session.difficulty = q.difficulty;

    const next: Message = {
      id: generateId(),
      role: "interviewer",
      content: `${reactions(
        evaluation.score,
        evaluation.followUpDirection
      )} ${q.question}`,
      timestamp: timestampNow(),
      questionIndex: session.currentQuestionIndex,
      metadata: {
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.type,
      },
    };

    session.messages.push(next);

    /*
     * Save the updated state locally as a best-effort fallback.
     * The browser also receives updatedSession and will keep it.
     */
    saveSession(session);

    return {
      evaluation,
      nextMessage: next,
      updatedSession: session,
      isComplete: false,
    };
  }

  async generateFinalReport(sessionId: string) {
    const session = loadSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return this.feedbackAgent.generateReport(
      session,
      this.getCandidate(session.candidateId)
    );
  }
}