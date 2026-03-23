export type ProjectStatus = "Discovery" | "Design" | "Development" | "Review" | "Delivered";
export type TaskStatus = "To Do" | "In Progress" | "Done";
export type LeadStatus = "New" | "Contacted" | "Responded" | "Qualified" | "Converted" | "Dead";
export type DealStage = "New Lead" | "Contacted" | "Proposal Sent" | "Negotiating" | "Closed Won" | "Closed Dead";

export interface Project {
  id: string;
  client_name: string;
  project_type: string;
  brief: string;
  status: ProjectStatus;
  deadline: string | null;
  value?: number | null;
  hours_logged?: number;
  client_id?: string | null;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  project_id: string | null;
  status: TaskStatus;
  priority?: string;
  due_date: string | null;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  model?: string;
  responseTime?: number;
  tokenCount?: number;
}

export interface AgentConversation {
  id: string;
  agent_id: string;
  project_id: string | null;
  messages: ChatMessage[];
  created_by: string;
  created_at: string;
}

export interface MockEmail {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  thread?: MockEmail[];
}

export interface Lead {
  id: string;
  name: string;
  url: string;
  industry: string;
  city: string;
  country: string;
  score: number | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
}

export interface PipelineDeal {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  stage: DealStage;
  value: number | null;
  last_contact: string | null;
  next_action: string | null;
  notes: string | null;
  client_name?: string;
  created_at: string;
}

export interface WebsiteAudit {
  id: string;
  url: string;
  scores: Record<string, number> | null;
  findings: Record<string, string[]> | null;
  recommendations: string[] | null;
  overall_score: number | null;
  lead_id: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  variables: string[];
  agent_id: string | null;
  use_count: number;
  created_at: string;
}

export interface BrandKit {
  id: string;
  project_id: string;
  colors: string[];
  fonts: string[];
  logo_url: string | null;
  tone_of_voice: string | null;
  target_audience: string | null;
}
