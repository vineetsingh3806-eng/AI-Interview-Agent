"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface KnowledgeNode {
  id: string;
  label: string;
  score?: number;
}

interface KnowledgeGraphProps {
  nodes?: KnowledgeNode[];
  className?: string;
}

const DEFAULT_NODES: KnowledgeNode[] = [
  { id: "python", label: "Python", score: 82 },
  { id: "ml", label: "ML", score: 74 },
  { id: "deep", label: "Deep Learning", score: 69 },
  { id: "llm", label: "LLM", score: 86 },
  { id: "rag", label: "RAG", score: 78 },
  { id: "agents", label: "Agents", score: 72 },
  { id: "system", label: "System Design", score: 66 },
];

const EDGES: Array<[string, string]> = [
  ["python", "ml"], ["ml", "deep"], ["ml", "llm"], ["llm", "rag"], ["llm", "agents"], ["agents", "system"],
];

export function KnowledgeGraph({ nodes = DEFAULT_NODES, className = "" }: KnowledgeGraphProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: -8, y: 12 });
  const [autoRotate, setAutoRotate] = useState(true);
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  const positioned = useMemo(() => {
    const radius = 120;
    const map = new Map<string, { x: number; y: number; z: number; node: KnowledgeNode }>();
    nodes.forEach((node, i) => {
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      map.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.68,
        z: Math.sin(angle * 1.7) * 65,
        node,
      });
    });
    return map;
  }, [nodes]);

  useEffect(() => {
    if (!autoRotate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timer = window.setInterval(() => {
      setRotation((r) => ({ ...r, y: r.y + 0.35 }));
    }, 40);
    return () => window.clearInterval(timer);
  }, [autoRotate]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      setRotation((r) => ({
        x: Math.max(-35, Math.min(35, r.x + (e.clientY - pointer.current.y) * 0.3)),
        y: r.y + (e.clientX - pointer.current.x) * 0.3,
      }));
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    const stop = () => { dragging.current = false; };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
    };
  }, []);

  const transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;

  return (
    <div
      ref={ref}
      className={`relative min-h-[390px] overflow-hidden rounded-3xl border border-white/8 bg-[#05070b]/70 [perspective:900px] ${className}`}
      onPointerDown={(e) => {
        setAutoRotate(false);
        dragging.current = true;
        pointer.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      role="img"
      aria-label="Interactive 3D knowledge graph. Drag to rotate."
    >
      <div className="absolute inset-0 graph-grid opacity-35" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/[0.06] [transform:rotateX(72deg)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.035] blur-3xl" />
      <div
        className="absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] transition-transform duration-150"
        style={{ transform }}
      >
        {EDGES.map(([a, b]) => {
          const p1 = positioned.get(a);
          const p2 = positioned.get(b);
          if (!p1 || !p2) return null;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const angle = Math.atan2(dy, dx);
          const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2 };
          return (
            <div
              key={`${a}-${b}`}
              className="absolute left-1/2 top-1/2 h-px origin-left bg-gradient-to-r from-indigo-400/35 to-cyan-300/15"
              style={{
                width: len,
                transform: `translate3d(${mid.x - len / 2}px, ${mid.y}px, ${mid.z}px) rotate(${angle}rad)`,
              }}
            />
          );
        })}

        {Array.from(positioned.values()).map(({ x, y, z, node }) => {
          const score = node.score ?? 70;
          return (
            <div
              key={node.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
              style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}
            >
              <div className="min-w-[92px] rounded-2xl border border-white/10 bg-[#0b0f16]/90 px-3 py-2 text-center shadow-[0_18px_40px_rgba(0,0,0,.45)] backdrop-blur-md">
                <div className="mx-auto mb-1 h-1.5 w-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,.35)]" />
                <div className="text-[11px] font-medium text-slate-100">{node.label}</div>
                <div className="mt-1 font-mono text-[9px] text-slate-500">{score}% evidence</div>
              </div>
            </div>
          );
        })}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [transform:translateZ(25px)]">
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-indigo-300/20 bg-indigo-500/[0.08] text-center shadow-[0_0_80px_rgba(99,102,241,.12)] backdrop-blur-xl">
            <span className="font-mono text-[8px] tracking-[0.22em] text-indigo-300/70">CANDIDATE</span>
            <span className="mt-1 text-xl font-semibold text-white">AI</span>
            <span className="text-[9px] text-slate-500">evidence map</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/8 bg-black/30 px-3 py-1.5 text-[10px] text-slate-500 backdrop-blur-md">
        Drag to rotate
      </div>
    </div>
  );
}
