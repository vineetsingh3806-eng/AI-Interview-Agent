import type { InterviewSession, Candidate, Question } from "@/types";
import curriculumData from "@/data/curriculum.json";
import { generateId, timestampNow } from "@/lib/utils";

export interface GeneratedQuestion { question:string; topic:string; day:number; type:Question["type"]; difficulty:Question["difficulty"]; expectedConcepts:string[]; transition:string; }
const typeCycle: Question["type"][] = ["conceptual","scenario","debugging","tradeoffs","architecture","system-design","best-practices"];


const domainQuestionBanks: Record<string, Array<{ question: string; topic: string; concepts: string[] }>> = {
  "software-engineering": [
    { question: "Walk me through the software development lifecycle for a feature from requirement to production.", topic: "SDLC", concepts: ["requirements", "design", "implementation", "testing", "deployment"] },
    { question: "Explain SOLID principles and give an example of when one of them improves maintainability.", topic: "Design Principles", concepts: ["SOLID", "coupling", "cohesion", "maintainability"] },
    { question: "How would you design a testing strategy for a production application?", topic: "Testing", concepts: ["unit testing", "integration testing", "end-to-end testing", "CI"] },
    { question: "Describe a design pattern you have used and explain the trade-off it introduced.", topic: "Design Patterns", concepts: ["abstraction", "composition", "trade-offs"] },
  ],
  "backend-development": [
    { question: "Design a REST API for a high-traffic application. How would you structure resources, validation and errors?", topic: "REST APIs", concepts: ["HTTP", "REST", "validation", "error handling"] },
    { question: "How would you design authentication and authorization for a backend service?", topic: "Authentication", concepts: ["sessions", "JWT", "RBAC", "security"] },
    { question: "An API suddenly becomes slow under load. How would you diagnose and improve it?", topic: "Backend Performance", concepts: ["profiling", "caching", "database", "latency"] },
    { question: "When would you choose synchronous APIs versus asynchronous messaging?", topic: "Distributed Systems", concepts: ["queues", "events", "retries", "consistency"] },
  ],
  "full-stack-development": [
    { question: "Design an end-to-end architecture for a web application from browser to database.", topic: "Full Stack Architecture", concepts: ["frontend", "API", "database", "deployment"] },
    { question: "How should a frontend application handle loading, errors, caching and optimistic updates?", topic: "Frontend State", concepts: ["state", "caching", "UX", "error handling"] },
    { question: "How would you secure data flowing between a React frontend and backend API?", topic: "Web Security", concepts: ["HTTPS", "CORS", "authentication", "validation"] },
    { question: "How would you scale a full-stack application from 1,000 to 1 million users?", topic: "Scalability", concepts: ["CDN", "caching", "horizontal scaling", "database"] },
  ],
  "frontend-development": [
    { question: "Explain how React rendering and reconciliation work and how you would avoid unnecessary renders.", topic: "React", concepts: ["components", "reconciliation", "memoization", "state"] },
    { question: "How would you manage complex client state in a large frontend application?", topic: "State Management", concepts: ["server state", "client state", "stores", "data flow"] },
    { question: "What techniques would you use to improve the performance of a slow web application?", topic: "Web Performance", concepts: ["code splitting", "lazy loading", "caching", "Core Web Vitals"] },
    { question: "How do you design an accessible and responsive UI component system?", topic: "UI Engineering", concepts: ["accessibility", "responsive design", "semantics", "design systems"] },
  ],
  "java-development": [
    { question: "Explain the four pillars of OOP in Java with practical examples.", topic: "Java OOP", concepts: ["encapsulation", "inheritance", "polymorphism", "abstraction"] },
    { question: "How do HashMap and HashSet work internally, and what makes a good hashCode implementation?", topic: "Java Collections", concepts: ["hashing", "equals", "hashCode", "buckets"] },
    { question: "How would you handle concurrency safely in a Java backend service?", topic: "Java Concurrency", concepts: ["threads", "locks", "synchronization", "executors"] },
    { question: "Explain dependency injection and why it improves testability in Spring-style applications.", topic: "Dependency Injection", concepts: ["IoC", "DI", "interfaces", "testing"] },
  ],
  "devops-cloud": [
    { question: "Design a CI/CD pipeline for a web application with automated testing and safe deployment.", topic: "CI/CD", concepts: ["pipelines", "testing", "artifacts", "deployment"] },
    { question: "How would you containerize and deploy a backend service using Docker?", topic: "Containers", concepts: ["Docker", "images", "containers", "networking"] },
    { question: "How would you design cloud infrastructure for a service that needs high availability?", topic: "Cloud Architecture", concepts: ["load balancing", "regions", "autoscaling", "health checks"] },
    { question: "What should you monitor in production and how would you respond to an incident?", topic: "Observability", concepts: ["logs", "metrics", "traces", "alerting"] },
  ],
  "data-analyst": [
    { question: "Write the SQL approach you would use to find the top five customers by revenue in the last 90 days.", topic: "SQL Analytics", concepts: ["SELECT", "GROUP BY", "ORDER BY", "date filtering"] },
    { question: "How would you clean a dataset containing missing values, duplicates and inconsistent categories?", topic: "Data Cleaning", concepts: ["missing values", "duplicates", "outliers", "standardization"] },
    { question: "A dashboard metric suddenly drops by 30%. How would you investigate whether the change is real?", topic: "Analytical Reasoning", concepts: ["data quality", "segmentation", "time series", "hypothesis"] },
    { question: "Which metrics would you choose to evaluate an e-commerce conversion funnel and why?", topic: "Business Metrics", concepts: ["conversion rate", "funnel", "retention", "revenue"] },
  ],
  "data-science": [
    { question: "How would you build a machine learning solution starting from a raw business problem?", topic: "Data Science Workflow", concepts: ["problem framing", "features", "modeling", "evaluation"] },
    { question: "How do you detect and prevent data leakage when training a model?", topic: "Model Validation", concepts: ["leakage", "train-test split", "cross-validation"] },
    { question: "How would you choose evaluation metrics for an imbalanced classification problem?", topic: "Evaluation Metrics", concepts: ["precision", "recall", "F1", "ROC-AUC"] },
    { question: "How would you explain a machine learning model's result to a non-technical stakeholder?", topic: "Model Communication", concepts: ["interpretability", "business impact", "uncertainty"] },
  ],
  "sql-database": [
    { question: "Explain INNER JOIN, LEFT JOIN and when each is useful in analytics queries.", topic: "SQL Joins", concepts: ["joins", "relationships", "NULL handling"] },
    { question: "How would you normalize a poorly designed relational database, and when might you denormalize it?", topic: "Database Design", concepts: ["normalization", "denormalization", "redundancy"] },
    { question: "A query on a large table is slow. How would you diagnose it and decide whether to add an index?", topic: "Indexes", concepts: ["query plan", "indexes", "selectivity", "write cost"] },
    { question: "Explain ACID transactions and give an example where isolation matters.", topic: "Transactions", concepts: ["ACID", "isolation", "consistency", "concurrency"] },
  ],
  "business-analytics": [
    { question: "How would you turn a vague business question into measurable KPIs?", topic: "KPI Design", concepts: ["business goals", "metrics", "leading indicators"] },
    { question: "A product's weekly active users fall sharply. What analyses would you run first?", topic: "Product Analytics", concepts: ["segmentation", "cohorts", "funnel", "retention"] },
    { question: "How would you design an experiment to test whether a new feature improves conversion?", topic: "Experimentation", concepts: ["A/B testing", "hypothesis", "statistical significance", "power"] },
    { question: "How do you communicate an analytical finding when the data is noisy or uncertain?", topic: "Data Storytelling", concepts: ["uncertainty", "context", "decision making"] },
  ],
  "cybersecurity": [
    { question: "What are the most important controls for securing a public REST API?", topic: "API Security", concepts: ["authentication", "authorization", "rate limiting", "validation"] },
    { question: "Explain SQL injection and how a backend team should prevent it.", topic: "Application Security", concepts: ["injection", "parameterized queries", "input validation"] },
    { question: "How would you investigate a suspicious login spike in production?", topic: "Security Monitoring", concepts: ["logs", "anomalies", "IP analysis", "incident response"] },
    { question: "Explain the principle of least privilege with a practical cloud example.", topic: "Access Control", concepts: ["IAM", "least privilege", "roles", "secrets"] },
  ],
  "system-design-general": [
    { question: "Design a URL shortening service that can handle millions of requests per day.", topic: "System Design", concepts: ["API", "database", "caching", "scalability"] },
    { question: "How would you design a notification system supporting email, SMS and push notifications?", topic: "Distributed Systems", concepts: ["queues", "workers", "retries", "idempotency"] },
    { question: "When would you use caching, and how would you handle cache invalidation?", topic: "Caching", concepts: ["TTL", "invalidation", "consistency", "Redis"] },
    { question: "Design a reliable service with graceful degradation when a dependency becomes unavailable.", topic: "Reliability", concepts: ["timeouts", "retries", "circuit breakers", "fallbacks"] },
  ],
};

const transforms: Record<Question["type"], (q:string)=>string> = {
  conceptual: q => q,
  scenario: q => `Imagine this is running in a production application. ${q} What would you do first and why?`,
  debugging: q => `A teammate says this implementation is correct, but it is failing in production. Starting from this concept — ${q} — what would you inspect and how would you debug it?`,
  tradeoffs: q => `${q} What trade-offs would you consider before choosing an implementation?`,
  architecture: q => `${q} Now place this inside a larger AI application. How would you structure the components and data flow?`,
  "system-design": q => `${q} Design the high-level system, including reliability, latency, scale and failure handling.`,
  "best-practices": q => `${q} What would you consider a best-practice implementation, and what common mistake would you avoid?`,
};

export class QuestionStrategist {
  buildCurriculumContext(candidate: Candidate): string {
    return curriculumData.days.filter(d=>candidate.completedDays.includes(d.day)).map(d=>`Day ${d.day}: ${d.title}\nTopics: ${d.topics.join(", ")}`).join("\n\n");
  }

  generateNextQuestion(session: InterviewSession, candidate: Candidate): GeneratedQuestion {
    const asked = new Set(session.questionHistory.map(q=>q.question));
    const askedDays = new Set(session.questionHistory.map(q=>q.day));
    const answeredWeak = session.memory.weakAreas.map(x=>x.toLowerCase());
    const skillDayMap: Record<string, number[]> = {
      python: [1],
      "machine-learning": [2],
      "deep-learning": [3],
      nlp: [4],
      llms: [5, 6],
      rag: [9, 10],
      "ai-agents": [8, 11],
      "system-design": [7, 13, 14],
      "software-engineering": [1, 7, 13, 14],
      "backend-development": [7, 13, 14],
      "full-stack-development": [1, 7, 13, 14],
      "frontend-development": [1, 7],
      "java-development": [1, 7, 13],
      "devops-cloud": [7, 13, 14],
      "data-analyst": [1, 2, 9],
      "data-science": [1, 2, 3, 9],
      "sql-database": [1, 7, 9],
      "business-analytics": [1, 2, 9],
      cybersecurity: [7, 13],
      "system-design-general": [7, 13, 14],
    };
    const selectedDays = session.targetSkill && skillDayMap[session.targetSkill]
      ? skillDayMap[session.targetSkill]
      : curriculumData.days.map(d=>d.day);
    const domainBank = session.targetSkill ? domainQuestionBanks[session.targetSkill] : undefined;
    if (domainBank?.length) {
      const level = session.interviewLevel || session.difficulty;
      const available = domainBank.filter(item => !session.questionHistory.some(q => q.question.includes(item.question)));
      const pool = available.length ? available : domainBank;
      const seed = Math.floor(Math.random() * pool.length);
      const item = pool[seed];
      const type = typeCycle[Math.floor(Math.random() * typeCycle.length)];
      const levelLead = level === "beginner"
        ? "Keep the explanation practical and focus on the core idea."
        : level === "intermediate"
          ? "Assume you are implementing this in a real product. Explain your reasoning and trade-offs."
          : "Answer as a senior engineer. Cover edge cases, scale, failure modes and production trade-offs.";
      const base = item.question;
      let question = `${levelLead} ${transforms[type](base)}`;
      if (asked.has(question)) question = `${question} Focus on the mechanism, trade-offs and a practical example.`;
      return {
        question,
        topic: item.topic,
        day: selectedDays[Math.floor(Math.random() * selectedDays.length)] ?? 1,
        type,
        difficulty: session.difficulty,
        expectedConcepts: item.concepts,
        transition: session.questionHistory.length === 0 ? `Let's focus this interview on ${session.targetSkill}.` : session.memory.strongAreas.includes(item.topic) ? "You have shown strength here. Let's push the depth further." : "Let's explore another part of this domain.",
      };
    }

    const candidateDays = candidate.completedDays.length ? candidate.completedDays : selectedDays;
    const completed = selectedDays.filter(d => candidateDays.includes(d));
    const eligibleDays = completed.length ? completed : selectedDays;
    const uncovered = eligibleDays.filter(d=>!askedDays.has(d));
    const dayNumber = uncovered[0] ?? eligibleDays[session.questionHistory.length % eligibleDays.length];
    const day = curriculumData.days.find(d=>d.day===dayNumber) ?? curriculumData.days[0];
    const weakTopic = day.topics.find(t => answeredWeak.some(w=>t.toLowerCase().includes(w) || w.includes(t.toLowerCase())));
    const topic = weakTopic ?? day.topics[session.questionHistory.length % day.topics.length];
    const level = session.interviewLevel || session.difficulty;
    const type = typeCycle[Math.floor(Math.random() * typeCycle.length)];
    const availableQuestions = day.keyQuestions.filter(q => !asked.has(q));
    const base = (availableQuestions.length ? availableQuestions : day.keyQuestions)[Math.floor(Math.random() * (availableQuestions.length ? availableQuestions.length : day.keyQuestions.length))] ?? `${day.keyQuestions[0]} Explain your reasoning and a practical example.`;
    const levelLead = level === "beginner"
      ? "Focus on the fundamentals and give a simple practical example."
      : level === "intermediate"
        ? "Use a real-world implementation perspective and explain trade-offs."
        : "Answer at senior level, including edge cases, scalability and production trade-offs.";
    let question = `${levelLead} ${transforms[type](base)}`;
    if (asked.has(question)) question = `${question} Focus on the mechanism rather than only the definition.`;
    return { question, topic, day:day.day, type, difficulty:session.difficulty, expectedConcepts:day.topics.slice(0,5), transition:session.questionHistory.length===0?(session.targetSkill ? `Let's focus this interview on ${session.targetSkill}.` : "Let's start with a core area from your ABTalks journey."):session.memory.strongAreas.includes(topic)?"You have shown strength here. I want to push the depth a little further.":"Let's explore another part of your learning journey." };
  }

  buildQuestionRecord(g: GeneratedQuestion, session: InterviewSession) {
    return {id:generateId(),question:g.question,topic:g.topic,day:g.day,type:g.type,difficulty:g.difficulty,expectedConcepts:g.expectedConcepts,followUpCount:0,askedAt:timestampNow(),skipped:false};
  }
}
