/**
 * LoaderPreview — dev-only page to test client loaders
 * Route: /loader-preview
 * Not linked in the nav — just for testing.
 */

import { useState } from "react";
import FitnessLankaLoader  from "@/components/loaders/FitnessLankaLoader";
import CinnamonOakLoader   from "@/components/loaders/CinnamonOakLoader";

type Active = "none" | "fitness" | "cinnamon";

export default function LoaderPreview() {
  const [active, setActive] = useState<Active>("none");

  const replay = (which: Active) => {
    setActive("none");
    // short tick so the component fully unmounts before remounting
    setTimeout(() => setActive(which), 80);
  };

  return (
    <>
      {/* ── Picker (hidden while a loader is playing) ── */}
      {active === "none" && (
        <div
          style={{
            position:       "fixed",
            inset:          0,
            background:     "#0a0a0a",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            24,
            fontFamily:     "system-ui, sans-serif",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11,
            letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>
            Loader Preview
          </p>

          <div style={{ display: "flex", gap: 16 }}>
            <button
              onClick={() => replay("fitness")}
              style={{
                padding:      "14px 28px",
                background:   "rgba(232,32,32,0.12)",
                border:       "1px solid rgba(232,32,32,0.35)",
                borderRadius: 8,
                color:        "#f87171",
                fontSize:     13,
                fontWeight:   600,
                letterSpacing:"0.08em",
                cursor:       "pointer",
                textTransform:"uppercase",
              }}
            >
              🏋️ Fitness Lanka
            </button>

            <button
              onClick={() => replay("cinnamon")}
              style={{
                padding:      "14px 28px",
                background:   "rgba(200,128,74,0.12)",
                border:       "1px solid rgba(200,128,74,0.35)",
                borderRadius: 8,
                color:        "#c8804a",
                fontSize:     13,
                fontWeight:   600,
                letterSpacing:"0.08em",
                cursor:       "pointer",
                textTransform:"uppercase",
              }}
            >
              ☕ Cinnamon Oak
            </button>
          </div>

          <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, margin: 0 }}>
            Click to replay at any time
          </p>
        </div>
      )}

      {/* ── Loaders ── */}
      {active === "fitness" && (
        <FitnessLankaLoader onComplete={() => setActive("none")} />
      )}
      {active === "cinnamon" && (
        <CinnamonOakLoader onComplete={() => setActive("none")} />
      )}
    </>
  );
}
