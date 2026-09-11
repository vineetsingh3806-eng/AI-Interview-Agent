import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function scoreToLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Average";
  if (score >= 40) return "Below Average";
  return "Poor";
}

export function scoreToColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 55) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function difficultyToColor(difficulty: string): string {
  switch (difficulty) {
    case "beginner": return "text-emerald-400 bg-emerald-400/10";
    case "intermediate": return "text-yellow-400 bg-yellow-400/10";
    case "advanced": return "text-red-400 bg-red-400/10";
    default: return "text-muted-foreground";
  }
}

export function hiringRecommendationConfig(rec: string) {
  switch (rec) {
    case "strong-hire":
      return { label: "Strong Hire", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" };
    case "hire":
      return { label: "Hire", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" };
    case "borderline":
      return { label: "Borderline", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" };
    case "no-hire":
      return { label: "No Hire", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" };
    default:
      return { label: "Pending", color: "text-muted-foreground", bg: "" };
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function timestampNow(): string {
  return new Date().toISOString();
}
