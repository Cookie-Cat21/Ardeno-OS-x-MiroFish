import { useEffect, useRef, useState } from "react";

// ── Particle canvas hook ───────────────────────────────────────────────────────
function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; r: number; alpha: number; red: boolean }[]
  >([]);
  const frameRef = useRef<number>();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width = canvas.offsetWidth || 600;
      canvas.height = canvas.offsetHeight || 480;
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.width;
    const H = () => canvas.height;
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 55; i++) {
        particlesRef.current.push({
          x: Math.random() * (canvas.width),
          y: Math.random() * (canvas.height),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.25 + 0.05,
          red: Math.random() > 0.85,
        });
      }
    }
    const draw = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // Vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      // Particles
      const pts = particlesRef.current;
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.red ? "#E82020" : "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // Connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.save();
            ctx.globalAlpha = (1 - d / 80) * 0.07;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current!);
      window.removeEventListener("resize", resize);
    };
  }, []);
}

// ── Main Component ────────────────────────────────────────────────────────────
const FitnessLankaLoader: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slashIn, setSlashIn] = useState<boolean[]>(Array(9).fill(false));
  const [wordmarkIn, setWordmarkIn] = useState(false);
  const [fillReveal, setFillReveal] = useState(false);
  useParticleCanvas(canvasRef);
  // Stagger slashes
  useEffect(() => {
    const timers = Array.from({ length: 9 }, (_, i) =>
      setTimeout(
        () => setSlashIn((prev) => { const n = [...prev]; n[i] = true; return n; }),
        i * 100 + 60
      )
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  // Wordmark reveal
  useEffect(() => {
    const t1 = setTimeout(() => setWordmarkIn(true), 500);
    const t2 = setTimeout(() => setFillReveal(true), 700);
    const t3 = setTimeout(() => onComplete?.(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);
  return (
    <div style={s.root}>
      {/* Canvas background */}
      <canvas ref={canvasRef} style={s.canvas} />
      {/* Ambient glow */}
      <div style={s.glow} />
      {/* Content */}
      <div style={s.content}>
        {/* Slash icon */}
        <div style={s.slashGroup}>
          {slashIn.map((visible, i) => (
            <div
              key={i}
              style={{
                ...s.slash,
                left: `${i * 14}px`,
                background: visible
                  ? i % 2 === 0 ? "#E82020" : "#FFFFFF"
                  : "rgba(255,255,255,0.06)",
                transform: `skewX(-18deg) scaleY(${visible ? 1 : 0})`,
                boxShadow:
                  visible && i % 2 === 0
                    ? "0 0 10px rgba(232,32,32,0.6), 0 0 20px rgba(232,32,32,0.2)"
                    : "none",
                transition: `transform 0.42s cubic-bezier(0.22,1,0.36,1) ${i * 35}ms, background 0.2s`,
              }}
            />
          ))}
        </div>
        {/* Wordmark */}
        <div
          style={{
            ...s.wordmark,
            opacity: wordmarkIn ? 1 : 0,
            transform: wordmarkIn ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <div style={s.fitnessOuter}>
            <span style={s.fitnessStroke}>FITNESS</span>
            <span
              style={{
                ...s.fitnessFill,
                clipPath: fillReveal ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
              }}
            >
              FITNESS
            </span>
          </div>
          <div style={{ ...s.divider, width: fillReveal ? 180 : 0 }} />
          <div
            style={{
              ...s.lankaText,
              color: fillReveal ? "rgba(220,30,30,0.9)" : "transparent",
              letterSpacing: fillReveal ? "0.72em" : "0.2em",
            }}
          >
            LANKA
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800&display=swap');
        @keyframes pulseGlow {
          0%,100% { opacity:.15; transform:scale(1); }
          50%      { opacity:.22; transform:scale(1.18); }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed", inset: 0,
    background: "#050505",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", userSelect: "none",
    zIndex: 9999,
  },
  canvas: {
    position: "absolute", inset: 0,
    width: "100%", height: "100%",
    pointerEvents: "none",
  },
  glow: {
    position: "absolute",
    width: 500, height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(220,30,30,0.18) 0%, transparent 65%)",
    animation: "pulseGlow 3s ease-in-out infinite",
    pointerEvents: "none",
    zIndex: 1,
  },
  content: {
    position: "relative", zIndex: 10,
    display: "flex", flexDirection: "column",
    alignItems: "center",
  },
  slashGroup: { position: "relative", width: 132, height: 76, marginBottom: 30 },
  slash: {
    position: "absolute", top: 0,
    width: 8, height: "100%",
    borderRadius: 1,
    transformOrigin: "bottom center",
  },
  wordmark: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 6,
    transition: "opacity 0.55s ease, transform 0.55s ease",
  },
  fitnessOuter: { position: "relative" },
  fitnessStroke: {
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    fontSize: 58, fontWeight: 800,
    letterSpacing: "0.18em",
    color: "transparent",
    WebkitTextStroke: "1.5px rgba(255,255,255,0.18)",
    textTransform: "uppercase", lineHeight: 1,
    display: "block",
  },
  fitnessFill: {
    position: "absolute", inset: 0,
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    fontSize: 58, fontWeight: 800,
    letterSpacing: "0.18em",
    color: "#FFFFFF",
    textTransform: "uppercase", lineHeight: 1,
    display: "block",
    transition: "clip-path 1s cubic-bezier(0.76,0,0.24,1) 0.1s",
  },
  divider: {
    height: 1,
    background: "linear-gradient(90deg, transparent, #E82020, transparent)",
    transition: "width 0.85s ease 0.1s",
  },
  lankaText: {
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    fontSize: 12, fontWeight: 600,
    textTransform: "uppercase",
    transition: "color 0.5s ease 0.15s, letter-spacing 0.85s cubic-bezier(0.22,1,0.36,1) 0.1s",
  },
};

export default FitnessLankaLoader;
