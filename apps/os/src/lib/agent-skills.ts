export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: string; // lucide icon name
  enabled: boolean;
  version: number;
  addedAt: string;
  usageCount: number;
  successRate: number; // 0-100
  toolDefinition: ToolDefinition;
}

export type SkillCategory = "data" | "communication" | "research" | "content" | "analysis" | "automation";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentSkillAssignment {
  agentId: string;
  skillIds: string[];
}

// Core skills that agents can access
export const AGENT_SKILLS: AgentSkill[] = [
  // DATA SKILLS
  {
    id: "create-lead",
    name: "Create Lead",
    description: "Create a new lead entry in the database with name, industry, score, and contact info",
    category: "data",
    icon: "UserPlus",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "create_lead",
      description: "Create a new lead in the CRM database",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Lead name or company name" },
          industry: { type: "string", description: "Industry category" },
          url: { type: "string", description: "Website URL" },
          email: { type: "string", description: "Contact email" },
          city: { type: "string", description: "City" },
          country: { type: "string", description: "Country" },
          score: { type: "number", description: "Lead score 1-10" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["name"],
      },
    },
  },
  {
    id: "create-task",
    name: "Create Task",
    description: "Create a new task and optionally assign it to a project",
    category: "data",
    icon: "ListTodo",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "create_task",
      description: "Create a task in the task management system",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"], description: "Priority level" },
          status: { type: "string", enum: ["To Do", "In Progress", "Done"], description: "Task status" },
          assigned_to: { type: "string", description: "Who to assign to" },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
        },
        required: ["title"],
      },
    },
  },
  {
    id: "update-deal",
    name: "Update Pipeline Deal",
    description: "Update a deal's stage, value, or notes in the sales pipeline",
    category: "data",
    icon: "TrendingUp",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "update_deal",
      description: "Update a pipeline deal's details",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "string", description: "The deal UUID to update" },
          stage: { type: "string", enum: ["New Lead", "Contacted", "Proposal Sent", "Negotiating", "Closed Won", "Closed Dead"] },
          value: { type: "number", description: "Deal value" },
          next_action: { type: "string", description: "Next action to take" },
          notes: { type: "string", description: "Deal notes" },
        },
        required: ["deal_id"],
      },
    },
  },
  {
    id: "query-data",
    name: "Query Database",
    description: "Search and retrieve records from leads, projects, tasks, proposals, and clients",
    category: "data",
    icon: "Search",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "query_data",
      description: "Query the database for existing records",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", enum: ["leads", "projects", "tasks", "proposals", "clients", "pipeline_deals", "invoices"], description: "Which table to query" },
          filters: { type: "object", description: "Key-value filters to apply" },
          limit: { type: "number", description: "Max records to return (default 10)" },
          order_by: { type: "string", description: "Column to order by" },
        },
        required: ["table"],
      },
    },
  },

  // COMMUNICATION SKILLS
  {
    id: "draft-email",
    name: "Draft Email",
    description: "Compose a professional email with subject, body, and recipient info",
    category: "communication",
    icon: "Mail",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "draft_email",
      description: "Draft a professional email",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body (supports markdown)" },
          tone: { type: "string", enum: ["formal", "friendly", "urgent", "follow-up"], description: "Email tone" },
        },
        required: ["subject", "body"],
      },
    },
  },
  {
    id: "create-proposal",
    name: "Create Proposal",
    description: "Generate a structured project proposal with scope, pricing, and timeline",
    category: "communication",
    icon: "FileText",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "create_proposal",
      description: "Create a project proposal in the database",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Proposal title" },
          value: { type: "number", description: "Proposed value/price" },
          features: { type: "array", items: { type: "string" }, description: "List of features/deliverables" },
          industry: { type: "string", description: "Client industry" },
          pages: { type: "number", description: "Number of pages" },
          notes: { type: "string", description: "Additional notes/scope details" },
        },
        required: ["title"],
      },
    },
  },
  {
    id: "log-outreach",
    name: "Log Outreach",
    description: "Record an outreach attempt with method, template used, and status",
    category: "communication",
    icon: "Send",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "log_outreach",
      description: "Log an outreach activity",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "Lead UUID" },
          method: { type: "string", enum: ["email", "phone", "linkedin", "whatsapp"], description: "Outreach method" },
          subject: { type: "string", description: "Message subject" },
          body_preview: { type: "string", description: "Preview of the message body" },
          template: { type: "string", description: "Template name used" },
        },
        required: ["method"],
      },
    },
  },

  // RESEARCH SKILLS
  {
    id: "analyze-website",
    name: "Analyze Website",
    description: "Perform a quick website audit checking design, SEO, and performance signals",
    category: "research",
    icon: "Globe",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "analyze_website",
      description: "Analyze a website and provide insights",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Website URL to analyze" },
          focus_areas: { type: "array", items: { type: "string", enum: ["design", "seo", "performance", "content", "accessibility"] }, description: "Areas to focus on" },
        },
        required: ["url"],
      },
    },
  },
  {
    id: "competitor-research",
    name: "Competitor Research",
    description: "Research and compare competitors' positioning, pricing, and offerings",
    category: "research",
    icon: "Target",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "competitor_research",
      description: "Research competitors for a given business or industry",
      parameters: {
        type: "object",
        properties: {
          company: { type: "string", description: "Company or brand to research competitors for" },
          industry: { type: "string", description: "Industry context" },
          aspects: { type: "array", items: { type: "string", enum: ["pricing", "features", "positioning", "design", "marketing"] }, description: "Aspects to compare" },
        },
        required: ["company"],
      },
    },
  },

  // CONTENT SKILLS
  {
    id: "generate-copy",
    name: "Generate Copy",
    description: "Write marketing copy, headlines, CTAs, or website content",
    category: "content",
    icon: "Pen",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "generate_copy",
      description: "Generate marketing or website copy",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["headline", "tagline", "cta", "about", "landing_page", "social_post", "blog_intro"], description: "Type of copy" },
          brand_voice: { type: "string", description: "Brand voice/tone to match" },
          target_audience: { type: "string", description: "Who the copy is for" },
          key_message: { type: "string", description: "Core message to convey" },
          length: { type: "string", enum: ["short", "medium", "long"], description: "Desired length" },
        },
        required: ["type", "key_message"],
      },
    },
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    description: "Plan a content calendar with topics, platforms, and posting schedule",
    category: "content",
    icon: "Calendar",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "content_calendar",
      description: "Create a content calendar plan",
      parameters: {
        type: "object",
        properties: {
          duration_weeks: { type: "number", description: "How many weeks to plan" },
          platforms: { type: "array", items: { type: "string", enum: ["instagram", "linkedin", "facebook", "twitter", "blog"] }, description: "Target platforms" },
          industry: { type: "string", description: "Industry for content themes" },
          goals: { type: "string", description: "Content goals" },
        },
        required: ["duration_weeks", "platforms"],
      },
    },
  },

  // ANALYSIS SKILLS
  {
    id: "score-lead",
    name: "Score Lead",
    description: "Evaluate and score a lead based on fit, budget potential, and urgency",
    category: "analysis",
    icon: "BarChart3",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "score_lead",
      description: "Score and qualify a lead",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Lead name" },
          industry: { type: "string", description: "Lead industry" },
          budget_range: { type: "string", description: "Estimated budget" },
          project_type: { type: "string", description: "Type of project they need" },
          urgency: { type: "string", enum: ["low", "medium", "high", "immediate"], description: "How urgent" },
          additional_context: { type: "string", description: "Any other qualifying info" },
        },
        required: ["lead_name"],
      },
    },
  },
  {
    id: "generate-report",
    name: "Generate Report",
    description: "Create a structured performance or status report with metrics and insights",
    category: "analysis",
    icon: "FileBarChart",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "generate_report",
      description: "Generate a performance or status report",
      parameters: {
        type: "object",
        properties: {
          report_type: { type: "string", enum: ["weekly", "monthly", "project_status", "pipeline", "lead_performance"], description: "Type of report" },
          date_range: { type: "string", description: "Date range to cover" },
          include_sections: { type: "array", items: { type: "string" }, description: "Sections to include" },
        },
        required: ["report_type"],
      },
    },
  },

  // AUTOMATION SKILLS
  {
    id: "create-project",
    name: "Create Project",
    description: "Set up a new project with client, type, brief, and deadline",
    category: "automation",
    icon: "FolderPlus",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "create_project",
      description: "Create a new project in the system",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Client name" },
          project_type: { type: "string", description: "Type of project" },
          brief: { type: "string", description: "Project brief" },
          value: { type: "number", description: "Project value" },
          deadline: { type: "string", description: "Deadline (YYYY-MM-DD)" },
        },
        required: ["client_name"],
      },
    },
  },
  {
    id: "create-invoice",
    name: "Create Invoice",
    description: "Generate an invoice with line items, amounts, and due date",
    category: "automation",
    icon: "Receipt",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "create_invoice",
      description: "Create a new invoice",
      parameters: {
        type: "object",
        properties: {
          invoice_number: { type: "string", description: "Invoice number" },
          amount: { type: "number", description: "Total amount" },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
          items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, amount: { type: "number" } } }, description: "Line items" },
          notes: { type: "string", description: "Invoice notes" },
        },
        required: ["invoice_number", "amount"],
      },
    },
  },
  // SITE BUILDER SKILLS
  {
    id: "optimize-seo",
    name: "Optimize SEO",
    description: "Analyze and optimize a website's SEO: meta tags, headings, keywords, alt text, structured data",
    category: "research",
    icon: "Search",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "optimize_seo",
      description: "Optimize website SEO",
      parameters: {
        type: "object",
        properties: {
          current_code: { type: "string", description: "Website code" },
          target_keywords: { type: "array", items: { type: "string" }, description: "Target keywords" },
          client_name: { type: "string" },
          industry: { type: "string" },
        },
        required: ["current_code"],
      },
    },
  },
  {
    id: "accessibility-audit",
    name: "Accessibility Audit",
    description: "Audit a website for WCAG accessibility issues: contrast, ARIA labels, keyboard nav, semantic HTML",
    category: "analysis",
    icon: "Target",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "accessibility_audit",
      description: "Audit website accessibility",
      parameters: {
        type: "object",
        properties: {
          current_code: { type: "string", description: "Website code" },
        },
        required: ["current_code"],
      },
    },
  },
  {
    id: "add-website-section",
    name: "Add Website Section",
    description: "Add a new section to a website: testimonials, FAQ, pricing, team, portfolio, gallery, CTA",
    category: "automation",
    icon: "FolderPlus",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "add_website_section",
      description: "Add a section to a website",
      parameters: {
        type: "object",
        properties: {
          section_type: { type: "string", enum: ["testimonials", "faq", "pricing", "team", "portfolio", "blog", "cta", "stats", "features", "gallery"] },
          current_code: { type: "string" },
          content: { type: "string" },
          position: { type: "string", enum: ["before-footer", "after-hero", "end"] },
          client_name: { type: "string" },
          industry: { type: "string" },
        },
        required: ["section_type", "current_code"],
      },
    },
  },
  {
    id: "generate-sitemap",
    name: "Generate Sitemap",
    description: "Generate XML sitemap and robots.txt for a website",
    category: "automation",
    icon: "Globe",
    enabled: true,
    version: 1,
    addedAt: "2024-01-01",
    usageCount: 0,
    successRate: 100,
    toolDefinition: {
      name: "generate_sitemap",
      description: "Generate sitemap and robots.txt",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Website domain" },
          pages: { type: "array", items: { type: "string" }, description: "Page paths" },
          client_name: { type: "string" },
        },
        required: ["domain"],
      },
    },
  },
];

// Default skill assignments per agent
export const DEFAULT_AGENT_SKILLS: AgentSkillAssignment[] = [
  { agentId: "orchestrator-prime", skillIds: ["query-data"] },
  { agentId: "orchestrator-backup", skillIds: ["query-data"] },
  { agentId: "copywriter", skillIds: ["generate-copy", "content-calendar", "draft-email"] },
  { agentId: "proposal-writer", skillIds: ["create-proposal", "query-data", "generate-report"] },
  { agentId: "social-media-writer", skillIds: ["generate-copy", "content-calendar"] },
  { agentId: "email-outreach", skillIds: ["draft-email", "log-outreach", "query-data"] },
  { agentId: "lead-qualifier", skillIds: ["score-lead", "create-lead", "update-deal", "query-data"] },
  { agentId: "client-support", skillIds: ["query-data", "create-task", "draft-email"] },
  { agentId: "content-strategist", skillIds: ["content-calendar", "generate-copy", "competitor-research"] },
  { agentId: "quick-researcher", skillIds: ["query-data", "competitor-research", "analyze-website"] },
  { agentId: "deep-researcher", skillIds: ["query-data", "competitor-research", "analyze-website", "generate-report"] },
  { agentId: "seo-analyst", skillIds: ["analyze-website", "generate-copy", "generate-report"] },
  { agentId: "code-agent", skillIds: ["query-data", "analyze-website"] },
  { agentId: "ui-ux-advisor", skillIds: ["analyze-website", "generate-report"] },
  { agentId: "competitor-analyst", skillIds: ["competitor-research", "analyze-website", "query-data", "generate-report"] },
  { agentId: "strategy-advisor", skillIds: ["query-data", "generate-report", "competitor-research", "score-lead"] },
  { agentId: "document-analyst", skillIds: ["query-data", "create-task", "generate-report"] },
  { agentId: "jci-tender-analyst", skillIds: ["query-data", "create-task", "generate-report", "create-proposal"] },
  { agentId: "brand-analyst", skillIds: ["analyze-website", "competitor-research", "generate-report"] },
  { agentId: "performance-reporter", skillIds: ["query-data", "generate-report", "draft-email"] },
  { agentId: "website-builder", skillIds: ["optimize-seo", "accessibility-audit", "add-website-section", "generate-sitemap", "analyze-website", "competitor-research", "generate-copy", "query-data"] },
];

export function getSkillsForAgent(agentId: string): AgentSkill[] {
  const assignment = DEFAULT_AGENT_SKILLS.find((a) => a.agentId === agentId);
  if (!assignment) return [];
  return assignment.skillIds
    .map((id) => AGENT_SKILLS.find((s) => s.id === id))
    .filter((s): s is AgentSkill => !!s && s.enabled);
}

export function getSkillById(id: string): AgentSkill | undefined {
  return AGENT_SKILLS.find((s) => s.id === id);
}

export function getSkillsByCategory(category: SkillCategory): AgentSkill[] {
  return AGENT_SKILLS.filter((s) => s.category === category);
}

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  data: "Data & CRM",
  communication: "Communication",
  research: "Research",
  content: "Content",
  analysis: "Analysis",
  automation: "Automation",
};

export const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
  data: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  communication: "text-green-400 bg-green-400/10 border-green-400/20",
  research: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  content: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  analysis: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  automation: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};
