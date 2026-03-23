import { motion, type Variants, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useState, useRef } from "react";
import {
  pageVariants,
  sectionReveal as childVariants,
  cardReveal as cardVariants,
  cardHoverMotion,
  staggerContainer,
} from "@/lib/motion";

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={reduceMotion ? undefined : pageVariants}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      exit={reduceMotion ? undefined : "exit"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeChild({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.div variants={reduceMotion ? undefined : childVariants} className={className}>{children}</motion.div>;
}

export function CardMotion({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={reduceMotion ? undefined : cardVariants}
      whileHover={reduceMotion ? undefined : cardHoverMotion.whileHover}
      whileTap={reduceMotion ? undefined : cardHoverMotion.whileTap}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated counter
export function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out with slight overshoot
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * ease);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        ref.current = value;
      }
    }

    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display}</>;
}

// Stagger container
export function StaggerContainer({ children, className, delay = 0.05 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      variants={reduceMotion ? undefined : staggerContainer(0, delay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { pageVariants, childVariants, cardVariants };
