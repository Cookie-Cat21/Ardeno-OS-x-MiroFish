import { type LucideIcon } from "lucide-react";
import { motion, useAnimationControls, type Transition } from "framer-motion";
import { useEffect, useCallback } from "react";

/**
 * Premium, contextual hover animations for each sidebar icon.
 * Each animation is designed to reflect what the icon *represents*.
 */

type AnimDef = {
  keyframes: Record<string, number | number[] | string | string[]>;
  transition: Transition;
};

const iconAnimations: Record<string, AnimDef> = {
  // Dashboard — tiles pop in with a satisfying scale pulse
  LayoutDashboard: {
    keyframes: {
      scale: [1, 0.88, 1.12, 1],
      rotate: [0, -3, 2, 0],
    },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },

  // Brain — organic throb like a thinking pulse
  Brain: {
    keyframes: {
      scale: [1, 1.18, 0.95, 1.08, 1],
      opacity: [1, 0.7, 1, 0.85, 1],
    },
    transition: { duration: 0.6, ease: "easeInOut" },
  },

  // Analytics bars — bounce up like bars growing
  BarChart3: {
    keyframes: {
      scaleY: [1, 1.35, 0.85, 1.15, 1],
      y: [0, -4, 1, -2, 0],
      originY: [1, 1, 1, 1, 1],
    },
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },

  // Bot — friendly wobble like waving hello
  Bot: {
    keyframes: {
      rotate: [0, -12, 14, -8, 6, -2, 0],
      y: [0, -2, 0, -1, 0],
    },
    transition: { duration: 0.6, ease: "easeInOut" },
  },

  // Zap — lightning strike: fast scale spike + flash
  Zap: {
    keyframes: {
      scale: [1, 1.25, 0.9, 1.1, 1],
      opacity: [1, 0.6, 1, 0.85, 1],
      y: [0, -5, 2, -1, 0],
      rotate: [0, -6, 3, 0],
    },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  // Globe — smooth 3D world spin
  Globe: {
    keyframes: {
      rotateY: [0, 360],
      scale: [1, 1.05, 1],
    },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  // Briefcase — picked up and set down, like grabbing it to go
  Briefcase: {
    keyframes: {
      y: [0, -8, -6, -8, 0],
      rotate: [0, -4, 3, -1, 0],
      scale: [1, 1.05, 1.05, 1.02, 1],
    },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },

  // Send (paper plane) — launches away and a new one swoops in
  Send: {
    keyframes: {
      x: [0, 24, -16, 0],
      y: [0, -12, 6, 0],
      scale: [1, 0.6, 0.6, 1],
      opacity: [1, 0, 0, 1],
      rotate: [0, 15, -10, 0],
    },
    transition: { duration: 0.6, ease: [0.36, 0, 0.66, -0.56] },
  },

  // FileText — page flip like turning a sheet
  FileText: {
    keyframes: {
      rotateY: [0, -25, 5, 0],
      scaleX: [1, 0.8, 1.05, 1],
      y: [0, -3, 0],
    },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },

  // DollarSign — coin flip with a satisfying bounce
  DollarSign: {
    keyframes: {
      rotateX: [0, 360],
      y: [0, -10, 0],
      scale: [1, 1.1, 1],
    },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },

  // FolderKanban — cards fan out slightly
  FolderKanban: {
    keyframes: {
      rotate: [0, -6, 4, -2, 0],
      x: [0, -2, 3, -1, 0],
      scale: [1, 1.08, 1],
    },
    transition: { duration: 0.45, ease: "easeInOut" },
  },

  // ListTodo — satisfying check stamp
  ListTodo: {
    keyframes: {
      scale: [1, 0.75, 1.2, 1],
      rotate: [0, 0, -8, 0],
    },
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },

  // Mail — envelope tilts back like opening
  Mail: {
    keyframes: {
      rotateX: [0, -35, 5, 0],
      y: [0, -4, 1, 0],
      scale: [1, 1.06, 1],
    },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },

  // FolderOpen — lid pops open
  FolderOpen: {
    keyframes: {
      y: [0, -5, -3, -5, 0],
      scale: [1, 1.1, 1.05, 1.08, 1],
      rotate: [0, -4, 2, 0],
    },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },

  // Settings — smooth gear rotation with a mechanical feel
  Settings: {
    keyframes: {
      rotate: [0, 120],
      scale: [1, 1.05, 1],
    },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fallbackAnimation: AnimDef = {
  keyframes: {
    scale: [1, 1.12, 0.95, 1],
    rotate: [0, -4, 4, 0],
  },
  transition: { duration: 0.4, ease: "easeInOut" },
};

interface NavIconProps {
  icon: LucideIcon;
  isActive: boolean;
  isHovered: boolean;
}

export function NavIcon({ icon: Icon, isActive, isHovered }: NavIconProps) {
  const controls = useAnimationControls();
  const iconName = Icon.displayName || "";
  const anim = iconAnimations[iconName] || fallbackAnimation;

  useEffect(() => {
    if (isHovered) {
      controls.start(anim.keyframes, anim.transition as any);
    } else {
      controls.stop();
      controls.set({ scale: 1, rotate: 0, x: 0, y: 0, opacity: 1, rotateX: 0, rotateY: 0, scaleX: 1, scaleY: 1 });
    }
  }, [isHovered, controls, anim]);

  return (
    <motion.div
      animate={controls}
      className="shrink-0 flex items-center justify-center"
      style={{ perspective: 600 }}
    >
      <Icon
        className={`h-[18px] w-[18px] transition-colors duration-150 ${
          isActive ? "text-primary" : isHovered ? "text-foreground/60" : "text-muted-foreground"
        }`}
        style={isActive ? { filter: "drop-shadow(0 0 12px rgba(255,79,0,0.35))" } : undefined}
      />
    </motion.div>
  );
}
