"use client";

export type InterviewLevel = "beginner" | "intermediate" | "advanced";

export interface InterviewLevelOption {
  id: InterviewLevel;
  label: string;
  description: string;
  difficulty: string;
}

export const INTERVIEW_LEVELS: InterviewLevelOption[] = [
  { id: "beginner", label: "Low Level", description: "Fundamentals, guided reasoning and practical basics.", difficulty: "Beginner" },
  { id: "intermediate", label: "Medium Level", description: "Real-world scenarios, trade-offs and deeper implementation details.", difficulty: "Intermediate" },
  { id: "advanced", label: "High Level", description: "Senior-level architecture, edge cases and production trade-offs.", difficulty: "Advanced" },
];

export interface InterviewSkill {
  id: string;
  label: string;
  description: string;
  days: number[];
  category?: string;
}

// Interview tracks available after login. Existing AI tracks are preserved;
// broader software/data tracks use dedicated question banks in QuestionStrategist.
export const INTERVIEW_SKILLS: InterviewSkill[] = [
  // AI / ML
  { id: "python", label: "Python", description: "Core Python, OOP, functions and problem solving", days: [1], category: "AI & ML" },
  { id: "machine-learning", label: "Machine Learning", description: "ML fundamentals, evaluation and model reasoning", days: [2], category: "AI & ML" },
  { id: "deep-learning", label: "Deep Learning", description: "Neural networks, backpropagation and optimization", days: [3], category: "AI & ML" },
  { id: "nlp", label: "NLP", description: "NLP fundamentals, embeddings and attention", days: [4], category: "AI & ML" },
  { id: "llms", label: "LLMs & Transformers", description: "Transformers, self-attention and LLM architecture", days: [5, 6], category: "AI & ML" },
  { id: "rag", label: "RAG", description: "Retrieval pipelines, chunking and hallucination control", days: [9, 10], category: "AI & ML" },
  { id: "ai-agents", label: "AI Agents", description: "Tools, agent loops, memory and function calling", days: [8, 11], category: "AI & ML" },
  { id: "system-design", label: "AI System Design", description: "Scalability, latency, reliability and production AI", days: [7, 13, 14], category: "AI & ML" },

  // Software engineering
  { id: "software-engineering", label: "Software Engineering", description: "SDLC, OOP, design patterns, testing, architecture and engineering practices", days: [1, 7, 13, 14], category: "Software" },
  { id: "backend-development", label: "Backend Development", description: "APIs, databases, authentication, scalability and server-side architecture", days: [7, 13, 14], category: "Software" },
  { id: "full-stack-development", label: "Full Stack Development", description: "Frontend, backend, APIs, databases and end-to-end application design", days: [1, 7, 13, 14], category: "Software" },
  { id: "frontend-development", label: "Frontend Development", description: "React, JavaScript, browser fundamentals, state and UI architecture", days: [1, 7], category: "Software" },
  { id: "java-development", label: "Java Development", description: "Core Java, OOP, collections, concurrency and backend fundamentals", days: [1, 7, 13], category: "Software" },
  { id: "devops-cloud", label: "DevOps & Cloud", description: "CI/CD, Docker, cloud architecture, deployment and observability", days: [7, 13, 14], category: "Software" },

  // Data
  { id: "data-analyst", label: "Data Analyst", description: "SQL, data cleaning, analytics, statistics, dashboards and business insights", days: [1, 2, 9], category: "Data" },
  { id: "data-science", label: "Data Science", description: "Statistics, Python, feature engineering, ML and data-driven reasoning", days: [1, 2, 3, 9], category: "Data" },
  { id: "sql-database", label: "SQL & Databases", description: "SQL queries, joins, normalization, indexing, transactions and database design", days: [1, 7, 9], category: "Data" },
  { id: "business-analytics", label: "Business Analytics", description: "KPIs, trends, experimentation, metrics and actionable business decisions", days: [1, 2, 9], category: "Data" },

  // Security / architecture
  { id: "cybersecurity", label: "Cybersecurity", description: "Web security, authentication, threats, secure APIs and defensive practices", days: [7, 13], category: "Security" },
  { id: "system-design-general", label: "System Design", description: "Scalable systems, APIs, caching, databases, queues and reliability", days: [7, 13, 14], category: "Architecture" },
];

const STORAGE_KEY = "aria-interview-skill";
const LEVEL_STORAGE_KEY = "aria-interview-level";

export function getSelectedSkill(): InterviewSkill | null {
  if (typeof window === "undefined") return null;
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    return INTERVIEW_SKILLS.find((skill) => skill.id === id) ?? null;
  } catch {
    return null;
  }
}

export function setSelectedSkill(skillId: string): InterviewSkill {
  const skill = INTERVIEW_SKILLS.find((item) => item.id === skillId);
  if (!skill) throw new Error("Please select a valid interview skill.");
  try {
    window.localStorage.setItem(STORAGE_KEY, skill.id);
  } catch {
    // The selected skill is still returned for the current navigation.
  }
  return skill;
}

export function getSelectedLevel(): InterviewLevel | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(LEVEL_STORAGE_KEY) as InterviewLevel | null;
    return value && INTERVIEW_LEVELS.some((level) => level.id === value) ? value : null;
  } catch { return null; }
}

export function setSelectedLevel(level: InterviewLevel): InterviewLevel {
  if (!INTERVIEW_LEVELS.some((item) => item.id === level)) throw new Error("Please select a valid interview level.");
  try { window.localStorage.setItem(LEVEL_STORAGE_KEY, level); } catch {}
  return level;
}

export function clearSelectedLevel(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(LEVEL_STORAGE_KEY); } catch {}
}

export function clearSelectedSkill(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
}
