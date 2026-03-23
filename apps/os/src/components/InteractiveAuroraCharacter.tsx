import { motion, useSpring, useAnimate } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import type { ExpressionType } from "@/lib/sentiment-analysis";

interface InteractiveAuroraCharacterProps {
  state: "idle" | "processing" | "success" | "error";
  size?: "sm" | "md" | "lg";
  expression?: ExpressionType;
  className?: string;
}

type IdleGesture = "none" | "nod" | "shake" | "sleeping";

export default function InteractiveAuroraCharacter({ 
  state, 
  size = "md", 
  expression = "neutral",
  className = ""
}: InteractiveAuroraCharacterProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleGesture, setIdleGesture] = useState<IdleGesture>("none");
  const [isSleeping, setIsSleeping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Spring physics for smooth 3D head movement
  const rotateXSpring = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateYSpring = useSpring(0, { stiffness: 150, damping: 20 });
  const translateZSpring = useSpring(0, { stiffness: 200, damping: 25 });

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  // Track mouse movement for 3D head rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Wake up if sleeping
      if (isSleeping) {
        setIsSleeping(false);
        setIdleGesture("none");
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxEngageDistance = Math.max(window.innerWidth, window.innerHeight) * 0.5;
        const engagement = Math.max(0, 1 - distance / maxEngageDistance);
        
        const maxDistance = Math.max(rect.width, rect.height);
        const eyeX = Math.max(-10, Math.min(10, (deltaX / maxDistance) * 20));
        const eyeY = Math.max(-6, Math.min(6, (deltaY / maxDistance) * 12));
        setMousePosition({ x: eyeX, y: eyeY });
        
        const rotateY = Math.max(-25, Math.min(25, (deltaX / maxEngageDistance) * 35));
        const rotateX = Math.max(-15, Math.min(15, -(deltaY / maxEngageDistance) * 20));
        
        rotateYSpring.set(rotateY);
        rotateXSpring.set(rotateX);
        translateZSpring.set(engagement * 10);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rotateXSpring, rotateYSpring, translateZSpring, isSleeping]);

  // Nod animation
  const doNod = () => {
    setIdleGesture("nod");
    rotateXSpring.set(-18);
    setTimeout(() => rotateXSpring.set(10), 250);
    setTimeout(() => rotateXSpring.set(-14), 500);
    setTimeout(() => rotateXSpring.set(6), 700);
    setTimeout(() => { rotateXSpring.set(0); setIdleGesture("none"); }, 950);
  };

  // Head shake animation
  const doShake = () => {
    setIdleGesture("shake");
    rotateYSpring.set(-20);
    setTimeout(() => rotateYSpring.set(20), 180);
    setTimeout(() => rotateYSpring.set(-15), 360);
    setTimeout(() => rotateYSpring.set(15), 540);
    setTimeout(() => rotateYSpring.set(-8), 720);
    setTimeout(() => { rotateYSpring.set(0); setIdleGesture("none"); }, 900);
  };

  // Fall asleep then drift
  const doSleep = () => {
    setIsSleeping(true);
    setIdleGesture("sleeping");
    rotateXSpring.set(12); // head droops forward
    rotateYSpring.set(8);  // slight tilt
  };

  // Idle gesture scheduler
  useEffect(() => {
    if (state !== "idle") { setIsSleeping(false); setIdleGesture("none"); return; }
    
    const scheduleGesture = () => {
      const delay = 4000 + Math.random() * 6000;
      gestureTimeoutRef.current = setTimeout(() => {
        if (isSleeping) { scheduleGesture(); return; }

        const roll = Math.random();
        if (roll < 0.25) {
          doNod();
          setTimeout(scheduleGesture, 2000);
        } else if (roll < 0.45) {
          doShake();
          setTimeout(scheduleGesture, 2000);
        } else if (roll < 0.55) {
          // Go to sleep — wake on next mouse move
          doSleep();
          // Auto-wake after 12s
          setTimeout(() => {
            setIsSleeping(false);
            setIdleGesture("none");
            rotateXSpring.set(0);
            rotateYSpring.set(0);
            scheduleGesture();
          }, 12000);
        } else {
          // Random look
          const bigX = (Math.random() - 0.5) * 20;
          const bigY = (Math.random() - 0.5) * 12;
          rotateYSpring.set(bigX);
          rotateXSpring.set(bigY);
          setTimeout(() => { rotateYSpring.set(0); rotateXSpring.set(0); }, 800 + Math.random() * 400);
          setTimeout(scheduleGesture, 2000);
        }
      }, delay);
    };

    scheduleGesture();
    return () => { if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current); };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Blinking — slower when sleeping
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      const chance = isSleeping ? 0.05 : 0.3;
      if (Math.random() < chance) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), isSleeping ? 300 : 150);
      }
    }, isSleeping ? 4000 : 2000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  const getStateAnimation = () => {
    switch (state) {
      case "processing":
        return {
          scale: [1, 1.05, 1],
          rotate: [0, 1, -1, 0],
        };
      case "success":
        return {
          scale: [1, 1.15, 1],
        };
      case "error":
        return {
          x: [-2, 2, -2, 2, 0],
        };
      default:
        return {
          scale: [1, 1.02, 1],
        };
    }
  };

  const getStateTransition = () => {
    switch (state) {
      case "processing":
        return { duration: 2, repeat: Infinity, ease: "easeInOut" as const };
      case "success":
        return { duration: 0.6, ease: "easeOut" as const };
      case "error":
        return { duration: 0.5, ease: "easeOut" as const };
      default:
        return { duration: 4, repeat: Infinity, ease: "easeInOut" as const };
    }
  };

  const stateAnimation = getStateAnimation();
  const stateTransition = getStateTransition();

  return (
    <div 
      ref={containerRef} 
      className={`relative ${sizeClasses[size]} ${className}`}
      style={{ perspective: "500px" }}
    >
      {/* Clean light off-white background */}
      <div className="absolute -inset-8 bg-gradient-to-br from-slate-50/80 via-white/90 to-slate-100/70 rounded-full blur-xl" />
      
      <motion.div 
        className="relative w-full h-full cursor-pointer"
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          translateZ: translateZSpring,
          transformStyle: "preserve-3d",
        }}
        animate={stateAnimation}
        transition={stateTransition}
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.3 }
        }}
      >
        {/* Ethereal aurora sphere - diffused and translucent */}
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{ transformStyle: "preserve-3d" }}>
          {/* Main diffused aurora layer with breathing effect */}
          <motion.div 
            className="absolute inset-[-20%]"
            style={{
              filter: "blur(16px)",
              background: `radial-gradient(circle at center, rgba(103, 232, 249, 0.4), rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.2), transparent 70%)`
            }}
            animate={state === "idle" ? {
              opacity: [0.25, 0.35, 0.25],
              scale: [1, 1.05, 1],
            } : { opacity: 0.3, scale: 1 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Secondary flowing layer with offset breathing */}
          <motion.div 
            className="absolute inset-[-15%]"
            style={{
              filter: "blur(12px)",
              background: `radial-gradient(ellipse at 30% 40%, rgba(139, 92, 246, 0.3), rgba(103, 232, 249, 0.2), transparent 60%)`,
            }}
            animate={state === "idle" ? {
              opacity: [0.15, 0.25, 0.15],
              rotate: [0, 360],
            } : { opacity: 0.2 }}
            transition={{
              opacity: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          />
          
          {/* Core translucent sphere with subtle pulse */}
          <motion.div 
            className="absolute inset-[10%] rounded-full"
            style={{
              filter: "blur(8px)",
              background: `radial-gradient(circle at center, rgba(103, 232, 249, 0.2), rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1))`,
              boxShadow: "0 0 60px rgba(139, 92, 246, 0.2)"
            }}
            animate={state === "idle" ? {
              opacity: [0.35, 0.45, 0.35],
              scale: [1, 1.02, 1],
            } : { opacity: 0.4, scale: 1 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          {/* Soft inner highlight */}
          <div 
            className="absolute inset-[25%] bg-gradient-to-t from-white/5 via-white/10 to-white/5 rounded-full"
            style={{ filter: "blur(2px)" }}
          />
        </div>

        {/* 3D Face container - moves with head rotation */}
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(15px)", // Face sits slightly forward in 3D space
          }}
        >
          {/* Clean geometric face - minimal white vector lines */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 100 100"
            style={{
              filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.9))"
            }}
          >
            <defs>
              <filter id="face-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Notion-style high curved eyebrows - clean geometric lines */}
            <motion.path
              d="M25 35 Q35 25 45 35"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              filter="url(#face-glow)"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: 1,
                // Eyebrows shift slightly with head turn for parallax
                translateX: mousePosition.x * 0.15,
                translateY: mousePosition.y * 0.1,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.path
              d="M55 35 Q65 25 75 35"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              filter="url(#face-glow)"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: 1,
                translateX: mousePosition.x * 0.15,
                translateY: mousePosition.y * 0.1,
              }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            />

            {/* Dot eyes that follow cursor with parallax offset */}
            <motion.circle
              cx={35}
              cy={45}
              r={isBlinking ? 0.2 : 2}
              fill="white"
              filter="url(#face-glow)"
              animate={{
                cx: 35 + mousePosition.x * 0.5,
                cy: 45 + mousePosition.y * 0.4,
                r: isBlinking ? 0.2 : 2,
                opacity: isBlinking ? 0.3 : 0.95
              }}
              transition={{ 
                cx: { type: "spring", stiffness: 300, damping: 25 },
                cy: { type: "spring", stiffness: 300, damping: 25 },
                r: { duration: isBlinking ? 0.1 : 0.15 },
                opacity: { duration: isBlinking ? 0.1 : 0.15 }
              }}
            />
            <motion.circle
              cx={65}
              cy={45}
              r={isBlinking ? 0.2 : 2}
              fill="white"
              filter="url(#face-glow)"
              animate={{
                cx: 65 + mousePosition.x * 0.5,
                cy: 45 + mousePosition.y * 0.4,
                r: isBlinking ? 0.2 : 2,
                opacity: isBlinking ? 0.3 : 0.95
              }}
              transition={{ 
                cx: { type: "spring", stiffness: 300, damping: 25 },
                cy: { type: "spring", stiffness: 300, damping: 25 },
                r: { duration: isBlinking ? 0.1 : 0.15 },
                opacity: { duration: isBlinking ? 0.1 : 0.15 }
              }}
            />

            {/* Prominent L-shaped nose - moves with head for 3D effect */}
            <motion.path
              d="M50 58 L50 65 L57 65"
              stroke="white"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#face-glow)"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: 1,
                translateX: mousePosition.x * 0.25,
                translateY: mousePosition.y * 0.15,
              }}
              transition={{ 
                pathLength: { duration: 0.6, delay: 0.4, ease: "easeOut" },
                translateX: { type: "spring", stiffness: 200, damping: 20 },
                translateY: { type: "spring", stiffness: 200, damping: 20 },
              }}
            />
          </svg>
        </motion.div>

        {/* Subtle ambient glow for ethereal effect */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 20px rgba(139, 92, 246, 0.1)",
              "0 0 30px rgba(103, 232, 249, 0.15)",
              "0 0 20px rgba(139, 92, 246, 0.1)"
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

      </motion.div>

      {/* Floating zzz when sleeping */}
      {isSleeping && (
        <div className="absolute -top-2 -right-2 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute font-bold select-none"
              style={{ 
                fontSize: `${10 + i * 4}px`,
                color: "hsl(var(--accent-glow) / 0.85)",
                textShadow: "0 0 8px hsl(var(--accent-glow) / 0.5), 0 0 20px hsl(var(--accent-glow) / 0.3), 0 0 40px hsl(var(--accent-glow) / 0.15)"
              }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [0, 8 + i * 6, 16 + i * 10],
                y: [0, -12 - i * 8, -28 - i * 14],
                scale: [0.5, 1, 0.8],
                rotate: [-10, 10, -5]
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.7,
                repeat: Infinity,
                ease: "easeOut"
              }}
            >
              z
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
