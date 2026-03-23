import { useEffect, useRef } from "react";

// ── Google Fonts injected once ─────────────────────────────────────────────
const injectFonts = () => {
  if (document.getElementById("cinnamon-oak-fonts")) return;
  const link = document.createElement("link");
  link.id = "cinnamon-oak-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Lato:wght@300;400&display=swap";
  document.head.appendChild(link);
};

// ── Oak Leaf SVG ───────────────────────────────────────────────────────────
const OakLeafIcon: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <defs>
      <radialGradient id="col-cbg" cx="50%" cy="38%" r="62%">
        <stop offset="0%" stopColor="#3a1c07" />
        <stop offset="100%" stopColor="#1c0d03" />
      </radialGradient>
      <linearGradient id="col-lfg" x1="30%" y1="10%" x2="70%" y2="90%">
        <stop offset="0%" stopColor="#c8804a" />
        <stop offset="50%" stopColor="#8b4a18" />
        <stop offset="100%" stopColor="#562a08" />
      </linearGradient>
      <filter id="col-shad">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="rgba(0,0,0,0.55)" />
      </filter>
    </defs>
    {/* Badge circle */}
    <circle cx="60" cy="60" r="53" fill="url(#col-cbg)" stroke="#5a2c0a" strokeWidth="1.8" />
    <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(80,40,10,0.3)" strokeWidth="0.8" />
    {/* Cardinal ticks */}
    <g stroke="rgba(110,60,18,0.35)" strokeWidth="1" strokeLinecap="round">
      <line x1="60" y1="5"   x2="60" y2="12" />
      <line x1="60" y1="108" x2="60" y2="115" />
      <line x1="5"  y1="60"  x2="12" y2="60" />
      <line x1="108" y1="60" x2="115" y2="60" />
    </g>
    {/* Leaf — sway animation via CSS class */}
    <g className="col-leaf-sway" filter="url(#col-shad)">
      <g transform="translate(21,22) scale(0.78)">
        {/* Oak leaf silhouette */}
        <path
          d="M 50,95 C 48,90 47,85 48,80 C 44,80 39,82 36,79 C 33,76 34,71 31,68
             C 27,65 22,66 20,62 C 18,58 20,53 18,49 C 16,45 11,44 11,39
             C 11,34 16,30 21,31 C 24,32 26,35 29,34 C 31,33 32,28 35,26
             C 38,24 42,25 44,23 C 46,21 46,16 50,15 C 54,16 54,21 56,23
             C 58,25 62,24 65,26 C 68,28 69,33 71,34 C 74,35 76,32 79,31
             C 84,30 89,34 89,39 C 89,44 84,45 82,49 C 80,53 82,58 80,62
             C 78,66 73,65 69,68 C 66,71 67,76 64,79 C 61,82 56,80 52,80
             C 53,85 52,90 50,95 Z"
          fill="url(#col-lfg)"
          stroke="#3d1a05"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Center vein + stem */}
        <line x1="50" y1="92" x2="50" y2="18" stroke="rgba(20,6,0,0.38)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="50" y1="95" x2="50" y2="88" stroke="rgba(20,6,0,0.5)"  strokeWidth="1.5" strokeLinecap="round" />
        {/* Left veins */}
        <line x1="50" y1="70" x2="35" y2="66" stroke="rgba(20,6,0,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="57" x2="32" y2="53" stroke="rgba(20,6,0,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="44" x2="33" y2="40" stroke="rgba(20,6,0,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="32" x2="38" y2="27" stroke="rgba(20,6,0,0.22)" strokeWidth="0.8" strokeLinecap="round" />
        {/* Right veins */}
        <line x1="50" y1="70" x2="65" y2="66" stroke="rgba(20,6,0,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="57" x2="68" y2="53" stroke="rgba(20,6,0,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="44" x2="67" y2="40" stroke="rgba(20,6,0,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="32" x2="62" y2="27" stroke="rgba(20,6,0,0.22)" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────
const CinnamonOakLoader: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    injectFonts();
    if (onComplete) {
      timerRef.current = setTimeout(onComplete, 2800);
    }
    return () => clearTimeout(timerRef.current);
  }, [onComplete]);
  return (
    <>
      <style>{`
        @keyframes col-popIn {
          from { opacity: 0; transform: scale(0.55) rotate(-5deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes col-fadeUp {
          from { opacity: 0; transform: translateY(9px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes col-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes col-growLine {
          from { width: 0; }
          to   { width: 52px; }
        }
        @keyframes col-steamUp {
          0%   { opacity: 0; transform: translateY(0); }
          35%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes col-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg); }
        }
        .col-icon-wrap {
          width: 120px; height: 120px;
          position: relative; margin-bottom: 22px;
          opacity: 0;
          animation: col-popIn 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards;
        }
        .col-steam {
          position: absolute; top: -22px; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 5px; align-items: flex-end;
        }
        .col-steam-wisp {
          width: 2px; border-radius: 3px;
          background: linear-gradient(to top, rgba(210,175,130,0.45), transparent);
          animation: col-steamUp 2.2s ease-in-out infinite;
        }
        .col-leaf-sway {
          animation: col-sway 4s ease-in-out infinite;
          transform-origin: 60px 55px;
        }
        .col-cinnamon {
          font-family: 'Lato', sans-serif;
          font-size: 12px; font-weight: 300;
          letter-spacing: 0.46em; color: #a86838;
          text-transform: uppercase;
          display: block; margin-bottom: 5px;
          opacity: 0;
          animation: col-fadeUp 0.6s ease 0.9s forwards;
        }
        .col-wordmark {
          display: block;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 50px; font-weight: 700; line-height: 1;
          opacity: 0;
          animation: col-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 1.1s forwards;
        }
        .col-divider {
          display: flex; align-items: center; gap: 10px;
          opacity: 0;
          animation: col-fadeIn 0.6s ease 1.6s forwards;
        }
        .col-div-line {
          height: 1px; width: 0;
          animation: col-growLine 0.7s ease 1.65s forwards;
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#1a0f06",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          zIndex: 9999,
        }}
      >
        {/* Warm radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 65% 60% at 50% 48%, rgba(90,42,10,0.68) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Icon */}
          <div className="col-icon-wrap">
            <OakLeafIcon />
            <div className="col-steam">
              <div className="col-steam-wisp" style={{ height: 15, animationDelay: "0s" }} />
              <div className="col-steam-wisp" style={{ height: 22, animationDelay: "0.4s" }} />
              <div className="col-steam-wisp" style={{ height: 14, animationDelay: "0.85s" }} />
            </div>
          </div>
          {/* Name */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span className="col-cinnamon">Cinnamon</span>
            <span className="col-wordmark">
              <span style={{ fontStyle: "italic", color: "#c8845a" }}>Oak</span>
              <span style={{ fontStyle: "normal", color: "#f0dfc4", marginLeft: 3 }}>Café</span>
            </span>
          </div>
          {/* Divider */}
          <div className="col-divider">
            <div
              className="col-div-line"
              style={{ background: "linear-gradient(90deg, transparent, rgba(150,90,40,0.5))" }}
            />
            <div
              style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(150,90,40,0.55)" }}
            />
            <div
              className="col-div-line"
              style={{ background: "linear-gradient(90deg, rgba(150,90,40,0.5), transparent)" }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CinnamonOakLoader;
