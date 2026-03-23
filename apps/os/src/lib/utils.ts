import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

/** Merge Tailwind + clsx classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Relative time string ("3 minutes ago") */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Risk label with colour classes */
export function riskLabel(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score < 40)  return { label: 'Low Risk',    color: 'text-green-400',  bg: 'bg-green-400/10' };
  if (score <= 70) return { label: 'Medium Risk', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  return                  { label: 'High Risk',   color: 'text-red-400',    bg: 'bg-red-400/10' };
}

/** Format currency (USD, no decimals) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Stage-aware score ranges for mock simulation */
const STAGE_SCORE_CONFIG: Record<
  string,
  { consensusMin: number; consensusMax: number; riskMin: number; riskMax: number }
> = {
  Intake:   { consensusMin: 65, consensusMax: 82, riskMin: 10, riskMax: 38 },
  Quote:    { consensusMin: 60, consensusMax: 80, riskMin: 15, riskMax: 42 },
  Design:   { consensusMin: 68, consensusMax: 86, riskMin: 12, riskMax: 35 },
  Build:    { consensusMin: 55, consensusMax: 78, riskMin: 22, riskMax: 55 },
  Security: { consensusMin: 50, consensusMax: 75, riskMin: 28, riskMax: 65 },
  Deploy:   { consensusMin: 72, consensusMax: 92, riskMin:  8, riskMax: 30 },
  Done:     { consensusMin: 80, consensusMax: 98, riskMin:  5, riskMax: 18 },
};

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate mock agent scores for a given project stage */
export function generateAgentScores(stage: string): {
  consensus: number;
  risk: number;
} {
  const cfg = STAGE_SCORE_CONFIG[stage] ?? STAGE_SCORE_CONFIG['Intake'];
  return {
    consensus: randBetween(cfg.consensusMin, cfg.consensusMax),
    risk:      randBetween(cfg.riskMin,      cfg.riskMax),
  };
}

/** Determine if scores warrant escalation */
export function scoreNeedsReview(consensus: number, risk: number): boolean {
  return consensus < 70 || risk > 70;
}

/** Generate a fake short git commit SHA */
export function generateCommitSha(): string {
  return Math.random().toString(16).slice(2, 9);
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Truncate long string with ellipsis */
export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Generate a random UUID-style ID (not crypto-secure, just for UI keys) */
export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}
