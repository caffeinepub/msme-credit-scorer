import { useEffect, useRef } from "react";

const COLORS = [
  [26, 115, 232] as [number, number, number], // #1A73E8 blue
  [52, 168, 83] as [number, number, number], // #34A853 green
  [250, 187, 5] as [number, number, number], // #FABB05 gold
];

interface Shape {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: [number, number, number];
  type: "circle" | "triangle";
  rotation: number;
  rotationSpeed: number;
  size: number;
  parallaxFactor: number;
}

interface WaveOrb {
  y: number;
  vy: number;
  color: [number, number, number];
  opacity: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function initShapes(w: number, h: number): Shape[] {
  const shapes: Shape[] = [];
  // 8 circles
  for (let i = 0; i < 8; i++) {
    const color = COLORS[i % COLORS.length];
    const x = Math.random() * w;
    const y = Math.random() * h;
    shapes.push({
      x,
      y,
      baseX: x,
      baseY: y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.15 + Math.random() * 0.25),
      radius: 4 + Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.07,
      color,
      type: "circle",
      rotation: 0,
      rotationSpeed: 0,
      size: 0,
      parallaxFactor: 0.015 + Math.random() * 0.02,
    });
  }
  // 4 triangles
  for (let i = 0; i < 4; i++) {
    const color = COLORS[i % COLORS.length];
    const x = Math.random() * w;
    const y = Math.random() * h;
    shapes.push({
      x,
      y,
      baseX: x,
      baseY: y,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -(0.1 + Math.random() * 0.2),
      radius: 0,
      opacity: 0.08 + Math.random() * 0.06,
      color,
      type: "triangle",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.004,
      size: 10 + Math.random() * 14,
      parallaxFactor: 0.01 + Math.random() * 0.015,
    });
  }
  return shapes;
}

function initWaveOrbs(h: number): WaveOrb[] {
  return COLORS.map((color, i) => ({
    y: (h / 3) * i + Math.random() * (h / 3),
    vy: 0.15 + Math.random() * 0.15,
    color,
    opacity: 0.06 + Math.random() * 0.04,
  }));
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  const h = size * 0.866; // sqrt(3)/2 for equilateral
  ctx.moveTo(0, -h * 0.667);
  ctx.lineTo(size / 2, h * 0.333);
  ctx.lineTo(-size / 2, h * 0.333);
  ctx.closePath();
  ctx.restore();
}

function renderPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shapes: Shape[],
  waveOrbs: WaveOrb[],
  mx: number,
  my: number,
) {
  ctx.clearRect(0, 0, w, h);

  // Draw breathing gradient wave orbs
  for (const orb of waveOrbs) {
    const [r, g, b] = orb.color;
    const grad = ctx.createRadialGradient(
      w / 2,
      orb.y,
      0,
      w / 2,
      orb.y,
      w * 1.5,
    );
    grad.addColorStop(0, `rgba(${r},${g},${b},${orb.opacity})`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${orb.opacity * 0.4})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, w, h);

    // Advance wave orb
    orb.y -= orb.vy;
    if (orb.y < -w) orb.y = h + w;
  }

  // Draw shapes with parallax response to mouse
  for (const s of shapes) {
    const [r, g, b] = s.color;
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;

    // Parallax offset from mouse
    const targetX = s.baseX + (mx - 0.5) * 40 * s.parallaxFactor * 100;
    const targetY = s.baseY + (my - 0.5) * 40 * s.parallaxFactor * 100;
    s.x = lerp(s.x, targetX, 0.03);
    s.y = lerp(s.y, targetY, 0.03);

    if (s.type === "circle") {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      s.rotation += s.rotationSpeed;
      drawTriangle(ctx, s.x, s.y, s.size, s.rotation);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Drift movement
    s.baseX += s.vx;
    s.baseY += s.vy;
    if (s.baseY < -20) {
      s.baseY = h + 20;
      s.baseX = Math.random() * w;
    }
    if (s.baseX < -20) s.baseX = w + 20;
    if (s.baseX > w + 20) s.baseX = -20;
  }

  ctx.globalAlpha = 1;
}

function SideCanvas({
  side,
  mouseRef,
}: {
  side: "left" | "right";
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0;
    let H = 0;
    let shapes: Shape[] = [];
    let waveOrbs: WaveOrb[] = [];

    function resize() {
      const vw = window.innerWidth;
      const contentWidth = Math.min(1280, vw);
      W = Math.max(0, (vw - contentWidth) / 2);
      H = window.innerHeight;

      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.scale(dpr, dpr);

      if (W > 0) {
        shapes = initShapes(W, H);
        waveOrbs = initWaveOrbs(H);
      }

      canvas!.style.display = W > 0 ? "block" : "none";
    }

    function frame() {
      if (W > 0) {
        const m = mouseRef.current;
        const nx = m.x / window.innerWidth;
        const ny = m.y / window.innerHeight;
        renderPanel(ctx!, W, H, shapes, waveOrbs, nx, ny);
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mouseRef]);

  const posStyle: React.CSSProperties =
    side === "left" ? { left: 0 } : { right: 0 };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        ...posStyle,
        zIndex: 0,
        pointerEvents: "none",
        willChange: "transform",
      }}
    />
  );
}

export function SidePanelAnimation() {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <>
      <SideCanvas side="left" mouseRef={mouseRef} />
      <SideCanvas side="right" mouseRef={mouseRef} />
    </>
  );
}
