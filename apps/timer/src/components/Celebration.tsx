"use client";

import { useEffect, useRef } from "react";
import type { CelebrationStyle } from "@/lib/rewards";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  spin: number;
  angle: number;
  /** Seconds it lives. */
  life: number;
  shape: "rect" | "square" | "dot";
  /** Fireworks fade as they slow; confetti flutters down. */
  drag: number;
  gravity: number;
}

const CUBE = ["#F4F4F4", "#FFD500", "#C41E3A", "#FF5800", "#0051BA", "#009E60"];
const CONFETTI = ["#4C8DFF", "#2FBF71", "#FFD23F", "#FF6B81", "#B794FF", "#38BDF8"];
const GOLD = ["#E2B13C", "#FFD23F", "#F5D36B", "#C8803F"];
const DURATION_S = 3;

const random = (min: number, max: number) => min + Math.random() * (max - min);
const choose = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

function particlesFor(style: CelebrationStyle, width: number, height: number): Particle[] {
  const out: Particle[] = [];
  if (style === "confetti" || style === "cube-confetti") {
    const colors = style === "cube-confetti" ? CUBE : CONFETTI;
    // Two bursts from the bottom corners, toward the middle.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 90; i++) {
        const speed = random(height * 0.9, height * 1.6);
        const angle = random(-Math.PI / 2 - 0.55, -Math.PI / 2 + 0.15);
        out.push({
          x: side < 0 ? 0 : width, y: height,
          vx: -side * Math.abs(Math.cos(angle)) * speed * 0.55, vy: Math.sin(angle) * speed,
          size: random(6, 11), color: choose(colors), spin: random(-12, 12), angle: random(0, Math.PI * 2),
          life: random(2.2, DURATION_S), shape: style === "cube-confetti" ? "square" : "rect", drag: 1.6, gravity: height * 0.9,
        });
      }
    }
  } else if (style === "gold-rain") {
    for (let i = 0; i < 160; i++) {
      out.push({
        x: random(0, width), y: random(-height * 0.6, 0), vx: random(-20, 20), vy: random(height * 0.25, height * 0.5),
        size: random(3, 7), color: choose(GOLD), spin: random(-6, 6), angle: random(0, Math.PI * 2),
        life: DURATION_S, shape: Math.random() < 0.5 ? "dot" : "rect", drag: 0, gravity: height * 0.15,
      });
    }
  } else if (style === "fireworks") {
    for (let burst = 0; burst < 4; burst++) {
      const cx = random(width * 0.2, width * 0.8);
      const cy = random(height * 0.15, height * 0.45);
      const color = choose(CONFETTI);
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 + random(-0.05, 0.05);
        const speed = random(height * 0.25, height * 0.45);
        out.push({
          x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: random(2.5, 4), color, spin: 0, angle: 0,
          // Later bursts start later (see startDelay).
          life: random(1.4, 2), shape: "dot", drag: 2.2, gravity: height * 0.25,
        });
      }
    }
  }
  return out;
}

/** Delay before each firework burst, by the particle's place in the list. */
const startDelay = (style: CelebrationStyle, index: number) => (style === "fireworks" ? Math.floor(index / 60) * 0.35 : 0);

/**
 * A burst over the whole screen when `trigger` changes (to a new solve id,
 * say). Taps go through it. Nothing is drawn for the quieter styles, or
 * for people who ask for less motion.
 */
export default function Celebration({ style, trigger }: { style: CelebrationStyle; trigger: string | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!trigger || !el || style === "label" || style === "glow") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const context = el.getContext("2d");
    if (!context) return undefined;

    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    el.width = width * ratio;
    el.height = height * ratio;
    context.scale(ratio, ratio);

    const particles = particlesFor(style, width, height);
    const start = performance.now();
    let last = start;
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      let alive = false;
      particles.forEach((p, i) => {
        const age = elapsed - startDelay(style, i);
        if (age < 0) {
          alive = true;
          return;
        }
        if (age > p.life) return;
        alive = true;
        const slow = Math.exp(-p.drag * dt);
        p.vx *= slow;
        p.vy = p.vy * slow + p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        context.globalAlpha = Math.max(0, Math.min(1, (p.life - age) / 0.6));
        context.fillStyle = p.color;
        context.save();
        context.translate(p.x, p.y);
        context.rotate(p.angle);
        if (p.shape === "dot") {
          context.beginPath();
          context.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          context.fill();
        } else if (p.shape === "square") {
          context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // Flutter: the paper's width changes as it turns.
          context.fillRect(-p.size / 2, -p.size / 4, p.size * Math.abs(Math.cos(p.angle * 0.7)) + 1, p.size / 2);
        }
        context.restore();
      });
      if (alive) frame = requestAnimationFrame(tick);
      else context.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, el.width, el.height);
    };
  }, [style, trigger]);

  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-40 h-full w-full" aria-hidden />;
}
