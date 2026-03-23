/**
 * AppLoader — Ardeno OS branded intro (Ardeno Studio internal tool)
 *
 * Just the Ardeno "A" — no client brand.
 * Client projects each have their own self-contained loader:
 *   → FitnessLankaLoader  (Ardeno A + Fitness Lanka brand)
 *   → CinnamonOakLoader   (Ardeno A + Cinnamon Oak Café brand)
 */

import { useEffect, useState } from "react";

// ── Inline SVG path for the Ardeno "A" (from ardeno-logo.svg) ─────────────
const ARDENO_A_PATH =
  "M 1114.464844 1093.320312 L 902.367188 666.722656 " +
  "C 839.917969 722.578125 784.960938 820.574219 788.027344 900.875 " +
  "L 852.203125 1027.425781 " +
  "C 854.507812 1031.96875 858.433594 1035.472656 863.210938 1037.246094 " +
  "L 1089.253906 1121.335938 " +
  "C 1106.46875 1127.742188 1122.644531 1109.769531 1114.464844 1093.320312 Z " +
  "M 733.84375 860.191406 " +
  "C 733.300781 860.992188 732.796875 861.84375 732.347656 862.757812 " +
  "L 651.828125 1025.953125 " +
  "C 649.539062 1030.585938 645.566406 1034.179688 640.71875 1035.984375 " +
  "L 410.511719 1121.617188 " +
  "C 393.394531 1127.992188 377.25 1110.242188 385.203125 1093.804688 " +
  "L 726.917969 387.246094 " +
  "C 734.253906 372.085938 755.8125 371.960938 763.3125 387.042969 " +
  "L 895.113281 652.152344 " +
  "C 822.84375 703.808594 766.253906 776.003906 733.84375 860.191406";

interface AppLoaderProps {
  onComplete: () => void;
}

export function AppLoader({ onComplete }: AppLoaderProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hold the A for 1300ms, fade out, then hand off
    const t1 = setTimeout(() => setVisible(false), 1300);
    const t2 = setTimeout(() => onComplete(),       1550);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        background:     "#050505",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexDirection:  "column",
        gap:            20,
        opacity:        visible ? 1 : 0,
        transition:     "opacity 0.25s ease",
        zIndex:         9999,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position:     "absolute",
          width:        340,
          height:       340,
          borderRadius: "50%",
          background:   "radial-gradient(circle, rgba(232,32,32,0.18) 0%, transparent 65%)",
          animation:    "appLoaderGlow 2s ease-in-out infinite",
          pointerEvents:"none",
        }}
      />

      {/* The "A" */}
      <div
        style={{
          position:  "relative",
          width:     120,
          height:    120,
          animation: "appLoaderScale 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
          opacity:   0,
        }}
      >
        <svg
          viewBox="0 0 1500 1500"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 24px rgba(232,32,32,0.5))" }}
        >
          <path fill="#E82020" fillRule="nonzero" d={ARDENO_A_PATH} />
        </svg>
      </div>

      {/* "Ardeno Studio" */}
      <p
        style={{
          fontFamily:    "system-ui, sans-serif",
          fontSize:      11,
          fontWeight:    500,
          letterSpacing: "0.32em",
          color:         "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          animation:     "appLoaderText 0.6s ease 0.3s forwards",
          opacity:       0,
          margin:        0,
        }}
      >
        Ardeno Studio
      </p>

      <style>{`
        @keyframes appLoaderScale {
          from { opacity: 0; transform: scale(0.72); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes appLoaderText {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes appLoaderGlow {
          0%,100% { opacity: 0.7; transform: scale(1);    }
          50%     { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
