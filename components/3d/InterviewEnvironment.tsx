"use client";

import { useEffect, useRef } from "react";

interface InterviewEnvironmentProps { className?: string; intensity?: "low" | "high"; }

export function InterviewEnvironment({ className = "", intensity = "low" }: InterviewEnvironmentProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const move = (e: PointerEvent) => {
      if (media.matches) return;
      const x = (e.clientX / window.innerWidth - .5) * 2;
      const y = (e.clientY / window.innerHeight - .5) * 2;
      el.style.setProperty("--mx", `${x}`);
      el.style.setProperty("--my", `${y}`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const beams = intensity === "high" ? 7 : 4;
  return (
    <div ref={ref} className={`aria-environment pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="aria-depth-layer aria-depth-back" />
      <div className="aria-ceiling" />
      <div className="aria-floor" />
      <div className="aria-horizon" />
      <div className="aria-ambient" />
      <div className="aria-orbit-field">
        {Array.from({ length: beams }).map((_, i) => <span key={i} className="aria-beam" style={{ "--i": i } as React.CSSProperties} />)}
      </div>
      <div className="aria-floating-dots">
        {Array.from({ length: intensity === "high" ? 18 : 10 }).map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
      </div>
    </div>
  );
}
