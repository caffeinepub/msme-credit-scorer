import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

interface Orb {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  colorIndex: number;
  colorT: number;
  colorSpeed: number;
}

interface DiagLine {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  angle: number;
  opacity: number;
  width: number;
}

const ORB_COLORS: [number, number, number][] = [
  [26, 115, 232],
  [52, 168, 83],
  [250, 187, 5],
  [26, 115, 232],
  [52, 168, 83],
];

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Safe non-null references for use in nested functions
    const safeCanvas = canvas;
    const safeCtx = ctx;

    const dpr = window.devicePixelRatio || 1;
    let W = 0;
    let H = 0;

    let particles: Particle[] = [];
    let orbs: Orb[] = [];
    let lines: DiagLine[] = [];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      safeCanvas.width = W * dpr;
      safeCanvas.height = H * dpr;
      safeCanvas.style.width = `${W}px`;
      safeCanvas.style.height = `${H}px`;
      safeCtx.scale(dpr, dpr);
      init();
    }

    function init() {
      const isMobile = W < 768;
      const particleCount = isMobile ? 25 : 50;

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 1.5 + Math.random() * 1.5,
        opacity: 0.12 + Math.random() * 0.06,
        color: ["#1A73E8", "#34A853", "#FABB05"][Math.floor(Math.random() * 3)],
      }));

      orbs = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        baseX: Math.random() * W,
        baseY: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 150 + Math.random() * 100,
        opacity: 0.08 + Math.random() * 0.04,
        colorIndex: i % ORB_COLORS.length,
        colorT: Math.random(),
        colorSpeed: 0.002 + Math.random() * 0.003,
      }));

      lines = Array.from({ length: 4 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0.2 + Math.random() * 0.2,
        vy: 0.15 + Math.random() * 0.15,
        length: 80 + Math.random() * 120,
        angle: 30 + Math.random() * 30,
        opacity: 0.05 + Math.random() * 0.03,
        width: 0.5 + Math.random() * 0.5,
      }));
    }

    function drawParticles() {
      for (const p of particles) {
        safeCtx.beginPath();
        safeCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        safeCtx.fillStyle = p.color;
        safeCtx.globalAlpha = p.opacity;
        safeCtx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;
        if (p.y > H + 5) p.y = -5;
      }
    }

    function drawOrbs(mx: number, my: number) {
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        orb.colorT += orb.colorSpeed;
        if (orb.colorT >= 1) {
          orb.colorT = 0;
          orb.colorIndex = (orb.colorIndex + 1) % ORB_COLORS.length;
        }
        const nextIdx = (orb.colorIndex + 1) % ORB_COLORS.length;
        const [r, g, b] = lerpColor(
          ORB_COLORS[orb.colorIndex],
          ORB_COLORS[nextIdx],
          orb.colorT,
        );

        const parallaxStrength = 0.03 + i * 0.01;
        const targetX =
          orb.baseX + (mx / W - 0.5) * 30 * parallaxStrength * 100;
        const targetY =
          orb.baseY + (my / H - 0.5) * 30 * parallaxStrength * 100;
        orb.x = lerp(orb.x, targetX, 0.02);
        orb.y = lerp(orb.y, targetY, 0.02);

        orb.baseX += orb.vx;
        orb.baseY += orb.vy;
        if (orb.baseX < -orb.radius) orb.baseX = W + orb.radius;
        if (orb.baseX > W + orb.radius) orb.baseX = -orb.radius;
        if (orb.baseY < -orb.radius) orb.baseY = H + orb.radius;
        if (orb.baseY > H + orb.radius) orb.baseY = -orb.radius;

        const grad = safeCtx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius,
        );
        grad.addColorStop(0, `rgba(${r},${g},${b},${orb.opacity})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        safeCtx.beginPath();
        safeCtx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        safeCtx.fillStyle = grad;
        safeCtx.globalAlpha = 1;
        safeCtx.fill();
      }
    }

    function drawLines() {
      for (const line of lines) {
        const rad = (line.angle * Math.PI) / 180;
        const ex = line.x + Math.cos(rad) * line.length;
        const ey = line.y + Math.sin(rad) * line.length;

        safeCtx.beginPath();
        safeCtx.moveTo(line.x, line.y);
        safeCtx.lineTo(ex, ey);
        safeCtx.strokeStyle = "#1A73E8";
        safeCtx.globalAlpha = line.opacity;
        safeCtx.lineWidth = line.width;
        safeCtx.stroke();

        line.x += line.vx;
        line.y += line.vy;
        if (line.x > W + line.length) {
          line.x = -line.length;
          line.y = Math.random() * H;
        }
        if (line.y > H + line.length) {
          line.y = -line.length;
          line.x = Math.random() * W;
        }
      }
    }

    function frame() {
      safeCtx.clearRect(0, 0, W, H);
      safeCtx.globalAlpha = 1;

      const mouse = mouseRef.current;
      mouse.x = lerp(mouse.x, mouse.targetX, 0.05);
      mouse.y = lerp(mouse.y, mouse.targetY, 0.05);

      drawOrbs(mouse.x, mouse.y);
      drawParticles();
      drawLines();

      safeCtx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(frame);
    }

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={-1}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
        willChange: "transform",
        outline: "none",
      }}
    />
  );
}
