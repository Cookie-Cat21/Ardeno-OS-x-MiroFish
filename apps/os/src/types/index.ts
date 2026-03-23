// ============================================================
// Ardeno OS – Central Type Definitions
// ============================================================

// ─── Project ─────────────────────────────────────────────────
export type ProjectStage =
  | 'Intake'
  | 'Quote'
  | 'Design'
  | 'Build'
  | 'Security'
  | 'Deploy'
  | 'Done';

export interface Project {
  id:              string;
  client_name:     string;
  title:           string;
  description?:    string;
  stage:           ProjectStage;
  consensus_score: number;
  risk_score:      number;
  github_branch?:  string;
  budget?:         number;
  deadline?:       string;
  created_at:      string;
  updated_at:      string;
  user_id:         string;
}

export const STAGE_ORDER: ProjectStage[] = [
  'Intake', 'Quote', 'Design', 'Build', 'Security', 'Deploy', 'Done',
];

export const STAGE_META: Record<
  ProjectStage,
  { label: string; color: string; bg: string; borderColor: string; hex: string }
> = {
  Intake:   { label: 'Intake',   color: 'text-blue-400',   bg: 'bg-blue-400/10',   borderColor: 'border-blue-400/25',   hex: '#60A5FA' },
  Quote:    { label: 'Quote',    color: 'text-purple-400', bg: 'bg-purple-400/10', borderColor: 'border-purple-400/25', hex: '#C084FC' },
  Design:   { label: 'Design',   color: 'text-pink-400',   bg: 'bg-pink-400/10',   borderColor: 'border-pink-400/25',   hex: '#F472B6' },
  Build:    { label: 'Build',    color: 'text-yellow-400', bg: 'bg-yellow-400/10', borderColor: 'border-yellow-400/25', hex: '#FACC15' },
  Security: { label: 'Security', color: 'text-red-400',    bg: 'bg-red-400/10',    borderColor: 'border-red-400/25',    hex: '#F87171' },
  Deploy:   { label: 'Deploy',   color: 'text-green-400',  bg: 'bg-green-400/10',  borderColor: 'border-green-400/25',  hex: '#4ADE80' },
  Done:     { label: 'Done',     color: 'text-primary',    bg: 'bg-primary/10',    borderColor: 'border-primary/25',    hex: '#FF4F00' },
};

// Stages that trigger automatic agent review when dragged to
export const REVIEW_TRIGGER_STAGES: ProjectStage[] = ['Build', 'Security'];

// Stage drag restriction: prevent backward movement from Done
export function canDragToStage(from: ProjectStage, to: ProjectStage): boolean {
  const fromIdx = STAGE_ORDER.indexOf(from);
  const toIdx   = STAGE_ORDER.indexOf(to);
  // Can always drag forward; can drag back up to 1 step (for corrections)
  // Cannot drag from Done to anything
  if (from === 'Done') return false;
  return toIdx >= fromIdx - 1;
}

// ─── Skill ───────────────────────────────────────────────────
export type SkillCategory =
  | 'Frontend'
  | 'Backend'
  | 'Security'
  | 'Localization'
  | 'DevOps'
  | 'Design'
  | 'General';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Frontend', 'Backend', 'Security', 'Localization', 'DevOps', 'Design', 'General',
];

export interface Skill {
  id:           string;
  name:         string;
  description?: string;
  category:     SkillCategory;
  success_rate: number;
  usage_count:  number;
  version:      string;
  last_updated: string;
  created_by?:  string;
  created_at:   string;
}

// ─── Agent Review ─────────────────────────────────────────────
export interface AgentReview {
  id:              string;
  project_id:      string;
  agent_name:      string;
  /** consensus_score is the DB column name (Iter 8); score is the legacy alias */
  consensus_score: number;
  score:           number;   // legacy alias — same value
  risk_score?:     number;
  weight?:         number;
  notes?:          string;
  stage_reviewed?: string;
  created_at:      string;
}

// ─── Audit Log ───────────────────────────────────────────────
export interface AuditLog {
  id:             string;
  action:         string;
  entity_type:    string;
  entity_id?:     string;
  project_id?:    string;  // added Iter 8 — project-scoped logs
  meta:           Record<string, unknown>;
  user_id?:       string;
  actor?:         string;
  created_at:     string;
  previous_state?: Record<string, unknown>;  // Iter 6 rollback
  rolled_back?:   boolean;                   // Iter 6 rollback
}

// ─── Activity Item (in-memory feed) ──────────────────────────
export type ActivityType =
  | 'stage_change'
  | 'review'
  | 'telegram'
  | 'system'
  | 'github'
  | 'create'
  | 'pdf'
  | 'skill';

export interface ActivityItem {
  id:          string;
  type:        ActivityType;
  title:       string;
  description?: string;
  timestamp:   Date;
  projectId?:  string;
}

// ─── Telegram ────────────────────────────────────────────────
export interface TelegramMessage {
  id:        string;
  role:      'user' | 'bot';
  text:      string;
  timestamp: Date;
  actions?:  { label: string; value: string }[];
}

// ─── Agent definitions (for performance dashboard) ───────────
export interface AgentDefinition {
  name:        string;
  role:        string;
  weight:      number;
  color:       string;
  icon:        string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  { name: 'Frontend Agent', role: 'UI/UX Review',       weight: 1.0, color: '#60A5FA', icon: '🎨' },
  { name: 'Security Agent', role: 'Security Audit',     weight: 1.5, color: '#F87171', icon: '🛡️' },
  { name: 'Lead Dev Agent', role: 'Technical Review',   weight: 2.0, color: '#4ADE80', icon: '⚙️' },
];
