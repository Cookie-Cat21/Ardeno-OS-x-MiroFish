import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ArdenoEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ardeno-panel cinematic-surface relative overflow-hidden rounded-[24px] px-6 py-8 text-center shadow-[0_26px_80px_-42px_rgba(0,0,0,0.95)]",
        "before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-primary/25 bg-primary/10 shadow-[0_0_0_1px_rgba(255,79,0,0.1),0_20px_40px_-28px_rgba(255,79,0,0.75)]">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="pill-label mx-auto mb-3 w-fit border-primary/15 bg-primary/[0.06] text-primary/85">Ardeno OS</div>
      <h3 className="font-display text-[clamp(1.1rem,1.5vw,1.4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-muted-foreground md:text-sm">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
