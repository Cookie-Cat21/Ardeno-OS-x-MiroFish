import { cn } from "@/lib/utils";
import ardenoMark from "@/assets/ardeno-logo.svg";
import ardenoStudioLockup from "@/assets/ardeno-studio-lockup.svg";

export function ArdenoMark({ className, glow = false }: { className?: string; glow?: boolean }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] shadow-[0_20px_48px_-26px_rgba(0,0,0,0.9)]",
        glow && "before:absolute before:inset-[-10px] before:-z-10 before:rounded-[22px] before:bg-[radial-gradient(circle,rgba(232,32,32,0.28)_0%,rgba(232,32,32,0.08)_40%,transparent_72%)]",
        className,
      )}
    >
      <img src={ardenoMark} alt="Ardeno" className="h-full w-full object-contain" />
    </div>
  );
}

export function ArdenoStudioLockup({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <img
      src={ardenoStudioLockup}
      alt="Ardeno Studio"
      className={cn("h-auto object-contain", compact ? "w-[164px]" : "w-[220px]", className)}
    />
  );
}
