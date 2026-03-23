import type { Transition, Variants } from "framer-motion";

export const ardenoDurations = {
  instant: 0.14,
  fast: 0.22,
  base: 0.32,
  medium: 0.46,
  slow: 0.72,
} as const;

export const ardenoEase = {
  sharp: [0.34, 0.78, 0, 1] as const,
  smooth: [0.2, 1, 0.3, 1] as const,
  settle: [0.24, 0.46, 0.36, 1] as const,
  cinematic: [0.16, 0.84, 0.24, 1] as const,
} as const;

export const ardenoTransitions = {
  fast: { duration: ardenoDurations.fast, ease: ardenoEase.settle } satisfies Transition,
  base: { duration: ardenoDurations.base, ease: ardenoEase.cinematic } satisfies Transition,
  medium: { duration: ardenoDurations.medium, ease: ardenoEase.smooth } satisfies Transition,
  glow: { duration: ardenoDurations.slow, ease: "easeInOut" } satisfies Transition,
  spring: { type: "spring", stiffness: 340, damping: 30, mass: 0.8 } satisfies Transition,
  softSpring: { type: "spring", stiffness: 240, damping: 28, mass: 0.9 } satisfies Transition,
  elevatedSpring: { type: "spring", stiffness: 280, damping: 26, mass: 0.88 } satisfies Transition,
  modalSpring: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } satisfies Transition,
} as const;

export const staggerContainer = (delayChildren = 0.06, staggerChildren = 0.06): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren,
    },
  },
});

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      ...ardenoTransitions.medium,
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
    transition: ardenoTransitions.fast,
  },
};

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: ardenoTransitions.medium,
  },
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.982 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: ardenoTransitions.base,
  },
};

export const heroReveal: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.985, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: ardenoTransitions.medium,
  },
};

export const listItemReveal = (index = 0): Variants => ({
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      ...ardenoTransitions.base,
      delay: index * 0.04,
    },
  },
});

export const collapsibleVariants: Variants = {
  closed: {
    opacity: 0,
    height: 0,
    transition: ardenoTransitions.fast,
  },
  open: {
    opacity: 1,
    height: "auto",
    transition: ardenoTransitions.base,
  },
};

export const buttonMotion = {
  whileHover: { y: -1.5, scale: 1.008, transition: ardenoTransitions.fast },
  whileTap: { y: 0, scale: 0.985, transition: { duration: ardenoDurations.instant } },
};

export const cardHoverMotion = {
  whileHover: { y: -4, scale: 1.006, transition: ardenoTransitions.base },
  whileTap: { scale: 0.995, transition: { duration: ardenoDurations.instant } },
};

export const panelHoverMotion = {
  whileHover: { y: -2, scale: 1.003, transition: ardenoTransitions.base },
  whileTap: { scale: 0.995, transition: { duration: ardenoDurations.instant } },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: ardenoTransitions.fast },
  exit: { opacity: 0, transition: ardenoTransitions.fast },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.965, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: ardenoTransitions.modalSpring,
  },
  exit: { opacity: 0, y: 8, scale: 0.985, transition: ardenoTransitions.fast },
};

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: ardenoTransitions.base,
  },
  exit: { opacity: 0, y: -4, scale: 0.985, transition: ardenoTransitions.fast },
};

export const navItemMotion = {
  whileHover: { x: 1, transition: ardenoTransitions.fast },
  whileTap: { scale: 0.992, transition: { duration: ardenoDurations.instant } },
};

export const navIndicatorMotion = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: ardenoTransitions.fast },
  exit: { opacity: 0, scale: 0.96, transition: ardenoTransitions.fast },
};
