"use client";

import { useEffect, useRef } from "react";

type AriaState = "idle" | "thinking" | "speaking" | "complete" | "error";

interface AriaCoreProps {
  state?: AriaState;
  compact?: boolean;
  className?: string;
}

interface Point3D { x: number; y: number; z: number; size: number; phase: number; }
const TAU = Math.PI * 2;

export function AriaCore({ state = "idle", compact = false, className = "" }: AriaCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    const motionChange = () => { reduced = media.matches; };
    media.addEventListener?.("change", motionChange);

    const points: Point3D[] = [];
    const count = compact ? 190 : 330;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, size: .55 + (i % 6) * .13, phase: i * .27 });
    }

    let raf = 0;
    const started = performance.now();
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (now: number) => {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, w, h);
      const t = (now - started) / 1000;
      const speed = reduced ? 0 : state === "thinking" ? .62 : state === "speaking" ? .9 : .2;
      const rot = t * speed;
      const pulse = state === "thinking" ? 1 + Math.sin(t * 5.4) * .055 : state === "speaking" ? 1 + Math.sin(t * 8) * .09 : 1 + Math.sin(t * 1.6) * .02;
      const base = Math.min(w, h) * .29 * pulse;
      const focal = Math.max(260, Math.min(w, h) * 1.8);
      const palette = state === "error" ? { a: "244,114,94", b: "251,146,60" } : state === "complete" ? { a: "125,211,252", b: "45,212,191" } : { a: "129,140,248", b: "56,189,248" };
      const cx = w / 2, cy = h / 2;

      // Deep-space atmosphere.
      const atmosphere = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 2.1);
      atmosphere.addColorStop(0, `rgba(${palette.a},.18)`);
      atmosphere.addColorStop(.32, `rgba(${palette.b},.07)`);
      atmosphere.addColorStop(.68, `rgba(${palette.a},.025)`);
      atmosphere.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, 0, w, h);

      // Perspective halo / containment field.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot * .12);
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(${i % 2 ? palette.b : palette.a},${.065 + i * .018})`;
        ctx.lineWidth = i === 1 ? 1.5 : 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, base * (1.18 + i * .16), base * (.26 + i * .055), i * .54, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // Wireframe latitude arcs give the core a real volumetric silhouette.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot * .22);
      for (let i = -3; i <= 3; i++) {
        const y = i * base * .14;
        const rr = Math.sqrt(Math.max(.08, 1 - (i / 4.2) ** 2)) * base;
        ctx.strokeStyle = `rgba(${palette.a},${i === 0 ? .22 : .095})`;
        ctx.lineWidth = i === 0 ? 1.25 : .75;
        ctx.beginPath();
        ctx.ellipse(0, y, rr, Math.max(3, rr * .2), 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // Sphere points, projected with perspective.
      const projected = points.map((p) => {
        const x1 = p.x * Math.cos(rot) - p.z * Math.sin(rot);
        const z1 = p.x * Math.sin(rot) + p.z * Math.cos(rot);
        const y1 = p.y * Math.cos(rot * .34) - z1 * Math.sin(rot * .34);
        const z2 = p.y * Math.sin(rot * .34) + z1 * Math.cos(rot * .34);
        const depth = focal / (focal + z2 * base);
        return { x: cx + x1 * base * depth, y: cy + y1 * base * depth, z: z2, depth, size: p.size * depth, phase: p.phase };
      }).sort((a, b) => a.z - b.z);
      for (const p of projected) {
        const shimmer = reduced ? .45 : .62 + Math.sin(t * 2.5 + p.phase) * .2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.phase % 3 > 1.5 ? palette.b : palette.a},${Math.max(.055, p.depth * shimmer)})`;
        ctx.arc(p.x, p.y, Math.max(.45, p.size), 0, TAU);
        ctx.fill();
      }

      // Orbiting intelligence markers.
      const orbitCount = compact ? 3 : 5;
      for (let i = 0; i < orbitCount; i++) {
        const a = rot * (i % 2 ? -.72 : .48) + i * TAU / orbitCount;
        const rx = base * (1.05 + i * .06);
        const ry = base * (.22 + i * .035);
        const ox = cx + Math.cos(a) * rx;
        const oy = cy + Math.sin(a) * ry;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${i % 2 ? palette.b : palette.a},.7)`;
        ctx.arc(ox, oy, i === 0 ? 2.2 : 1.4, 0, TAU);
        ctx.fill();
      }

      // Central optical lens.
      const coreR = base * .47;
      const lens = ctx.createRadialGradient(cx - coreR * .22, cy - coreR * .28, coreR * .05, cx, cy, coreR);
      lens.addColorStop(0, "rgba(250,252,255,.86)");
      lens.addColorStop(.1, `rgba(${palette.a},.55)`);
      lens.addColorStop(.36, `rgba(${palette.b},.16)`);
      lens.addColorStop(.72, `rgba(${palette.a},.035)`);
      lens.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lens;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, TAU); ctx.fill();

      // Iris + rotating scan ring.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rot * .62);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(${i === 1 ? palette.b : palette.a},${state === "thinking" ? .38 : .19})`;
        ctx.lineWidth = i === 1 ? 1.4 : .8;
        ctx.beginPath();
        ctx.ellipse(0, 0, coreR * (.58 + i * .1), coreR * (.23 + i * .065), i * .78, 0, TAU);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(235,248,255,${state === "speaking" ? .42 : .18})`;
      ctx.setLineDash([base * .08, base * .055]);
      ctx.beginPath(); ctx.arc(0, 0, coreR * .84, 0, TAU); ctx.stroke();
      ctx.restore();

      // Thin scanline adds a controlled holographic depth cue.
      if (!reduced) {
        const scanY = cy + Math.sin(t * .9) * base * .62;
        const scan = ctx.createLinearGradient(cx - base, scanY, cx + base, scanY);
        scan.addColorStop(0, "rgba(255,255,255,0)");
        scan.addColorStop(.5, `rgba(${palette.b},.10)`);
        scan.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = scan;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - base, scanY); ctx.lineTo(cx + base, scanY); ctx.stroke();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); media.removeEventListener?.("change", motionChange); };
  }, [compact, state]);

  const label = state === "thinking" ? "THINKING" : state === "speaking" ? "SPEAKING" : state === "complete" ? "READY" : state === "error" ? "ATTENTION" : "ARIA ONLINE";
  return (
    <div className={`relative isolate ${className}`} aria-label={`Aria AI core — ${label.toLowerCase()}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 backdrop-blur-sm shadow-[0_0_35px_rgba(99,102,241,.08)]">
          <span className="font-mono text-[9px] tracking-[0.24em] text-slate-300/75">{label}</span>
        </div>
      </div>
    </div>
  );
}
