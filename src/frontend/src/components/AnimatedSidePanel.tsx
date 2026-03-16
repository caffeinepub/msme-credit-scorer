import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
}

interface Circle {
  x: number;
  y: number;
  r: number;
  speedX: number;
  speedY: number;
}

interface Triangle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  speedX: number;
  speedY: number;
}

const FEATURES = [
  "Multi-Score Credit Analysis",
  "Real-Time Risk Intelligence",
  "Bank-Grade Loan Pre-Approval",
];

export function AnimatedSidePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const handleResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.5 + Math.random() * 2.5,
      speedY: -(0.3 + Math.random() * 0.6),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: 0.08 + Math.random() * 0.12,
      color: Math.random() > 0.6 ? "255,210,80" : "255,255,255",
    }));

    const circles: Circle[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 40 + Math.random() * 60,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
    }));

    const triangles: Triangle[] = Array.from({ length: 4 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.005,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
    }));

    function drawParticle(p: Particle) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
      ctx.fill();
    }

    function drawCircle(c: Circle) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function drawTriangle(t: Triangle) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);
      ctx.beginPath();
      ctx.moveTo(0, -t.size);
      ctx.lineTo(t.size * 0.866, t.size * 0.5);
      ctx.lineTo(-t.size * 0.866, t.size * 0.5);
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function drawGlowBurst(x: number, y: number, r: number, alpha: number) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    let glowPhase = 0;
    const glowPoints = [
      { x: 0.2, y: 0.3 },
      { x: 0.8, y: 0.6 },
      { x: 0.5, y: 0.85 },
    ];

    function animate() {
      ctx.clearRect(0, 0, W, H);
      glowPhase += 0.01;

      for (let i = 0; i < glowPoints.length; i++) {
        const gp = glowPoints[i];
        const alpha = 0.04 + 0.04 * Math.sin(glowPhase + i * 2);
        drawGlowBurst(
          gp.x * W,
          gp.y * H,
          100 + 30 * Math.sin(glowPhase + i),
          alpha,
        );
      }

      for (const c of circles) {
        c.x += c.speedX;
        c.y += c.speedY;
        if (c.x < -c.r) c.x = W + c.r;
        if (c.x > W + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = H + c.r;
        if (c.y > H + c.r) c.y = -c.r;
        drawCircle(c);
      }

      for (const t of triangles) {
        t.rotation += t.rotSpeed;
        t.x += t.speedX;
        t.y += t.speedY;
        if (t.x < -t.size) t.x = W + t.size;
        if (t.x > W + t.size) t.x = -t.size;
        if (t.y < -t.size) t.y = H + t.size;
        if (t.y > H + t.size) t.y = -t.size;
        drawTriangle(t);
      }

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        drawParticle(p);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0d1b4b 0%, #1A73E8 40%, #0a5c3a 80%, #34A853 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      />

      {/* Large circle top-right */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
        }}
      />
      <div
        className="absolute top-10 -right-10 w-40 h-40 rounded-full"
        style={{
          border: "1px solid rgba(250,187,5,0.12)",
          background: "rgba(250,187,5,0.05)",
        }}
      />

      {/* Triangle bottom-left */}
      <div
        className="absolute bottom-12 left-8 w-24 h-24"
        style={{
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          background: "rgba(255,255,255,0.06)",
          animation: "rotateSlow 20s linear infinite",
        }}
      />

      {/* Hexagon mid-left */}
      <div
        className="absolute top-1/2 -left-8 w-20 h-20"
        style={{
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          background: "rgba(250,187,5,0.09)",
          animation: "fadeGlow 6s ease-in-out infinite",
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-10 text-white text-center gap-6">
        <div style={{ animation: "pulseLogo 3s ease-in-out infinite" }}>
          <img
            src="/assets/generated/credvist-logo-transparent.dim_400x400.png"
            alt="CredVist"
            className="w-20 h-20 object-contain drop-shadow-2xl"
          />
        </div>

        <div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "'Montserrat', 'Bricolage Grotesque', sans-serif",
            }}
          >
            Cred<span style={{ color: "#FABB05" }}>Vist</span>
          </h1>
          <p
            className="mt-2 text-sm"
            style={{
              color: "rgba(255,255,255,0.70)",
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            AI-Powered Credit Intelligence
          </p>
        </div>

        <div
          className="w-12 h-px"
          style={{ background: "rgba(250,187,5,0.5)" }}
        />

        <ul className="space-y-3 text-left">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <CheckCircle2
                className="shrink-0 w-4 h-4"
                style={{ color: "#34A853" }}
              />
              <span
                className="text-sm"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                {f}
              </span>
            </li>
          ))}
        </ul>

        <div
          className="mt-2 px-4 py-2 rounded-full text-xs"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.75)",
            fontFamily: "'Roboto', sans-serif",
            backdropFilter: "blur(8px)",
          }}
        >
          🔒 Bank-Grade Security &amp; Privacy
        </div>
      </div>
    </div>
  );
}
