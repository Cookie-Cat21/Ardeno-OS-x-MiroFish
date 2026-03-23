/**
 * Character personality configurations for InteractiveCharacter.
 * Each personality defines unique hover behavior, color theme, and idle animation.
 */

export type CharacterPersonality =
  | "orchestrator"
  | "creative"
  | "analyst"
  | "strategist"
  | "developer"
  | "outreach"
  | "support";

export interface PersonalityConfig {
  label: string;
  /** CSS color variable for the primary glow */
  glowColor: string;
  /** Hover animation style */
  hoverAnimation: {
    scale: number;
    rotate: number | number[];
    filter: string;
  };
  /** Tap animation */
  tapAnimation: {
    scale: number;
    rotate: number;
  };
  /** Idle breathing style */
  idleAnimation: {
    scale: number[];
    duration: number;
  };
  /** Ambient glow gradient */
  ambientGlow: string;
  /** Hover glow gradient */
  hoverGlow: string;
  /** Conic sparkle colors */
  sparkleGradient: string;
}

const personalities: Record<CharacterPersonality, PersonalityConfig> = {
  orchestrator: {
    label: "Orchestrator",
    glowColor: "--primary",
    hoverAnimation: {
      scale: 1.1,
      rotate: [-2, 2, -2, 2, 0],
      filter: "brightness(1.4) drop-shadow(0 0 24px hsl(var(--primary) / 0.7))",
    },
    tapAnimation: { scale: 0.95, rotate: 5 },
    idleAnimation: { scale: [1, 1.02, 1], duration: 4 },
    ambientGlow: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)",
    hoverGlow: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 80%)",
    sparkleGradient: "conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.3), transparent, hsl(var(--accent) / 0.2), transparent)",
  },
  creative: {
    label: "Creative",
    glowColor: "--accent",
    hoverAnimation: {
      scale: 1.15,
      rotate: [-5, 5, -3, 3, -1, 1, 0],
      filter: "brightness(1.5) drop-shadow(0 0 28px hsl(var(--accent) / 0.8)) hue-rotate(15deg)",
    },
    tapAnimation: { scale: 0.9, rotate: -10 },
    idleAnimation: { scale: [1, 1.04, 0.98, 1], duration: 3 },
    ambientGlow: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 70%)",
    hoverGlow: "radial-gradient(ellipse, hsl(var(--accent) / 0.25) 0%, hsl(var(--primary) / 0.1) 50%, transparent 80%)",
    sparkleGradient: "conic-gradient(from 45deg, transparent, hsl(var(--accent) / 0.4), transparent, hsl(var(--primary) / 0.3), transparent, hsl(var(--warning) / 0.2), transparent)",
  },
  analyst: {
    label: "Analyst",
    glowColor: "--primary",
    hoverAnimation: {
      scale: 1.08,
      rotate: [0, 1, -1, 0],
      filter: "brightness(1.3) drop-shadow(0 0 20px hsl(var(--primary) / 0.6)) contrast(1.1)",
    },
    tapAnimation: { scale: 0.97, rotate: 2 },
    idleAnimation: { scale: [1, 1.01, 1], duration: 5 },
    ambientGlow: "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
    hoverGlow: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
    sparkleGradient: "conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.2), transparent)",
  },
  strategist: {
    label: "Strategist",
    glowColor: "--warning",
    hoverAnimation: {
      scale: 1.12,
      rotate: [-1, 3, -1, 0],
      filter: "brightness(1.35) drop-shadow(0 0 22px hsl(var(--warning) / 0.7)) saturate(1.2)",
    },
    tapAnimation: { scale: 0.93, rotate: 8 },
    idleAnimation: { scale: [1, 1.03, 1.01, 1], duration: 4.5 },
    ambientGlow: "radial-gradient(circle, hsl(var(--warning) / 0.06) 0%, transparent 70%)",
    hoverGlow: "radial-gradient(circle, hsl(var(--warning) / 0.2) 0%, hsl(var(--accent) / 0.08) 60%, transparent 80%)",
    sparkleGradient: "conic-gradient(from 90deg, transparent, hsl(var(--warning) / 0.35), transparent, hsl(var(--primary) / 0.2), transparent)",
  },
  developer: {
    label: "Developer",
    glowColor: "--success",
    hoverAnimation: {
      scale: 1.06,
      rotate: [0, 0.5, -0.5, 0],
      filter: "brightness(1.25) drop-shadow(0 0 18px hsl(var(--success) / 0.7)) saturate(1.1)",
    },
    tapAnimation: { scale: 0.96, rotate: 1 },
    idleAnimation: { scale: [1, 1.015, 1], duration: 6 },
    ambientGlow: "radial-gradient(circle, hsl(var(--success) / 0.04) 0%, transparent 60%)",
    hoverGlow: "radial-gradient(circle, hsl(var(--success) / 0.18) 0%, transparent 75%)",
    sparkleGradient: "conic-gradient(from 0deg, transparent, hsl(var(--success) / 0.25), transparent, hsl(var(--primary) / 0.15), transparent)",
  },
  outreach: {
    label: "Outreach",
    glowColor: "--primary",
    hoverAnimation: {
      scale: 1.14,
      rotate: [-3, 6, -3, 6, 0],
      filter: "brightness(1.45) drop-shadow(0 0 26px hsl(var(--primary) / 0.75))",
    },
    tapAnimation: { scale: 0.88, rotate: -15 },
    idleAnimation: { scale: [1, 1.025, 0.99, 1], duration: 3.5 },
    ambientGlow: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
    hoverGlow: "radial-gradient(ellipse 120% 100%, hsl(var(--primary) / 0.22) 0%, transparent 80%)",
    sparkleGradient: "conic-gradient(from 30deg, transparent, hsl(var(--primary) / 0.35), transparent, hsl(var(--accent) / 0.25), transparent, hsl(var(--warning) / 0.15), transparent)",
  },
  support: {
    label: "Support",
    glowColor: "--success",
    hoverAnimation: {
      scale: 1.1,
      rotate: [-2, 2, -1, 1, 0],
      filter: "brightness(1.3) drop-shadow(0 0 20px hsl(var(--success) / 0.6))",
    },
    tapAnimation: { scale: 0.94, rotate: 3 },
    idleAnimation: { scale: [1, 1.02, 1], duration: 4.5 },
    ambientGlow: "radial-gradient(circle, hsl(var(--success) / 0.05) 0%, transparent 70%)",
    hoverGlow: "radial-gradient(circle, hsl(var(--success) / 0.18) 0%, transparent 80%)",
    sparkleGradient: "conic-gradient(from 0deg, transparent, hsl(var(--success) / 0.3), transparent, hsl(var(--primary) / 0.15), transparent)",
  },
};

/** Map agent IDs to personality types */
const agentPersonalityMap: Record<string, CharacterPersonality> = {
  "orchestrator-prime": "orchestrator",
  "orchestrator-backup": "orchestrator",
  "copywriter": "creative",
  "social-media-writer": "creative",
  "content-strategist": "creative",
  "brand-analyst": "creative",
  "proposal-writer": "strategist",
  "strategy-advisor": "strategist",
  "jci-tender-analyst": "strategist",
  "email-outreach": "outreach",
  "lead-qualifier": "outreach",
  "client-support": "support",
  "quick-researcher": "analyst",
  "deep-researcher": "analyst",
  "seo-analyst": "analyst",
  "competitor-analyst": "analyst",
  "document-analyst": "analyst",
  "performance-reporter": "analyst",
  "code-agent": "developer",
  "ui-ux-advisor": "developer",
};

export function getPersonality(agentId?: string): PersonalityConfig {
  const type = agentId ? (agentPersonalityMap[agentId] || "orchestrator") : "orchestrator";
  return personalities[type];
}

export function getPersonalityType(agentId?: string): CharacterPersonality {
  return agentId ? (agentPersonalityMap[agentId] || "orchestrator") : "orchestrator";
}

export default personalities;
