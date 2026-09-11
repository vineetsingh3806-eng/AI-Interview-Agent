import { geminiChat, parseJsonFromLLM } from "@/lib/gemini";
import { buildFeedbackPrompt } from "@/prompts/feedback";
import type { InterviewSession, Candidate, FinalReport } from "@/types";
import { timestampNow } from "@/lib/utils";

const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
const pct=(n:number)=>Math.round(Math.max(0,Math.min(10,n))*10);

export class FeedbackAgent {
 async generateReport(session:InterviewSession,candidate:Candidate):Promise<FinalReport>{
  const answered=session.questionHistory.filter(q=>!q.skipped&&q.evaluation); const scores=answered.map(q=>q.score??0); const overall=pct(avg(scores));
  try{
   const raw=await geminiChat([{role:"user",content:buildFeedbackPrompt(session,candidate)}],{temperature:.25,max_tokens:1100,timeoutMs:18000});
   const data=parseJsonFromLLM<any>(raw);
   return {...data,sessionId:session.sessionId,candidateId:session.candidateId,generatedAt:timestampNow(),totalDuration:session.totalDuration??0,transcript:session.messages,questionHistory:session.questionHistory,overallScore:Math.max(0,Math.min(100,Number(data.overallScore)||overall)),executiveSummary:data.executiveSummary||`${session.candidateName||candidate.name} completed ${session.questionHistory.length} questions across ${session.memory.coveredDays.length} curriculum days.`};
  }catch(e){
   console.warn("[FeedbackAgent] deterministic fallback:",e);
   const topics=[...new Map(session.questionHistory.map(q=>[`${q.day}:${q.topic}`,q])).values()].map(q=>{const qs=session.questionHistory.filter(x=>x.day===q.day&&x.topic===q.topic);const vals=qs.filter(x=>!x.skipped).map(x=>x.score??0);return {topic:q.topic,day:q.day,score:pct(avg(vals)),questionsAsked:qs.length,questionsAnswered:vals.length,coverage:(vals.length>=2?"full":vals.length===1?"partial":"minimal") as "full"|"partial"|"minimal"};});
   const dimNames=["Technical Accuracy","Communication","Problem Solving","System Thinking","Practical Knowledge"];
   const dims=dimNames.map((name,i)=>({name,score:Math.max(0,overall-[0,4,7,10,3][i]),description:["Correctness and conceptual precision across technical answers.","Clarity, structure and ability to communicate engineering reasoning.","Ability to reason through scenarios, debugging and ambiguity.","Architecture, scalability, reliability and trade-off awareness.","Evidence of production-oriented implementation knowledge."][i]}));
   const rec=overall>=85?"strong-hire":overall>=70?"hire":overall>=55?"borderline":"no-hire";
   const missed=[...new Set(session.questionHistory.flatMap(q=>q.evaluation?.missedConcepts??[]))].slice(0,10);
   return {sessionId:session.sessionId,candidateId:session.candidateId,generatedAt:timestampNow(),totalDuration:session.totalDuration??0,overallScore:overall,topicScores:topics,dimensions:dims,strengths:session.memory.strongAreas.slice(0,5),weaknesses:session.memory.weakAreas.slice(0,5),missedConcepts:missed,improvementPlan:["Revisit the lowest-scoring curriculum topics with active recall.","Practice one scenario and one debugging exercise for each weak area.","Build and explain a production-style AI system with explicit trade-offs."],recommendedDays:[...new Set(session.questionHistory.filter(q=>(q.score??0)<6).map(q=>q.day))].slice(0,4),recommendedProjects:["Production RAG assistant with evaluation and observability","Tool-using AI agent with guardrails","LLM interview/evaluation platform with adaptive memory"],hiringRecommendation:rec,hiringRationale:`The candidate demonstrated an average interview score of ${overall}/100 across ${session.questionHistory.length} questions. The recommendation is derived from observed answers rather than a fixed label.`,executiveSummary:`${session.candidateName||candidate.name} completed ${session.questionHistory.length} questions across ${session.memory.coveredDays.length} curriculum days. The interview highlighted ${session.memory.strongAreas.slice(0,2).join(" and ")||"developing strengths"} and identified ${session.memory.weakAreas.slice(0,2).join(" and ")||"no dominant weak area"}.`,transcript:session.messages,questionHistory:session.questionHistory};
  }
 }
}
