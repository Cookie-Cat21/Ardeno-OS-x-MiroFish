import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENTS: Record<string, { name: string; systemPrompt: string; skills: string[] }> = {
  "orchestrator-prime": {
    name: "Orchestrator Prime",
    systemPrompt: "You are the master orchestrator. You coordinate tasks and can also create new skills when needed capabilities are missing.",
    skills: ["query_data", "create_skill"],
  },
  copywriter: {
    name: "Copywriter",
    systemPrompt: "You are an expert web copywriter for a premium web design agency. Write compelling, conversion-focused copy that is clean, modern, and professional. Match the client's brand voice.",
    skills: ["generate_copy", "content_calendar", "draft_email"],
  },
  "proposal-writer": {
    name: "Proposal Writer",
    systemPrompt: "You are a business proposal specialist for Ardeno Studio, a high-end web design agency in Sri Lanka. Write professional, persuasive proposals that clearly communicate value and justify premium pricing.",
    skills: ["create_proposal", "query_data", "generate_report"],
  },
  "social-media-writer": {
    name: "Social Media Writer",
    systemPrompt: "You write engaging social media content for web design agencies and their clients. Keep copy concise, on-brand, and optimised for engagement.",
    skills: ["generate_copy", "content_calendar"],
  },
  "email-outreach": {
    name: "Email Outreach",
    systemPrompt: "You are an expert at writing professional business emails for a web design agency. Write clear, concise, and persuasive emails that get responses. Never be pushy.",
    skills: ["draft_email", "log_outreach", "query_data"],
  },
  "lead-qualifier": {
    name: "Lead Qualifier",
    systemPrompt: "You qualify leads for a premium web design agency. Analyse the lead's message, score them 1-10 on fit and budget potential, identify their core need, and suggest next steps.",
    skills: ["score_lead", "create_lead", "update_deal", "query_data"],
  },
  "client-support": {
    name: "Client Support",
    systemPrompt: "You are a professional client success manager for Ardeno Studio. Respond to client queries warmly, clearly, and helpfully. Always maintain a premium, friendly tone.",
    skills: ["query_data", "create_task", "draft_email"],
  },
  "parallel-society": {
    name: "Parallel Society Specialist",
    systemPrompt: "You are the specialist for the MiroFish Parallel Society and the EXCLUSIVE bridge to the Discord communication layer. Your goal is to coordinate large-scale simulations across 300+ agents. You must ensure all simulation discussions are mirrored in the correct Discord department channels and threads. Provide deep, data-driven insights based on persistent departmental simulations while maintaining continuous sync between Ardeno OS and Discord.",
    skills: ["simulate_foresight"], 
  },
  "content-strategist": {
    name: "Content Strategist",
    systemPrompt: "You are a content strategy expert for digital agencies. Create detailed content plans, campaign ideas, and brand messaging frameworks tailored to the client's industry.",
    skills: ["content_calendar", "generate_copy", "competitor_research"],
  },
  "quick-researcher": {
    name: "Quick Researcher",
    systemPrompt: "You are a fast research assistant. Given any topic, provide a concise, well-structured summary with the most important facts, insights, and actionable takeaways.",
    skills: ["query_data", "competitor_research", "analyze_website"],
  },
  "deep-researcher": {
    name: "Deep Researcher",
    systemPrompt: "You are a professional research analyst. Produce thorough, well-structured research reports with citations, key insights, and strategic implications.",
    skills: ["query_data", "competitor_research", "analyze_website", "generate_report"],
  },
  "seo-analyst": {
    name: "SEO Analyst",
    systemPrompt: "You are an SEO specialist for web design agencies. Provide actionable SEO recommendations, keyword strategies, and optimised meta content for client websites.",
    skills: ["analyze_website", "generate_copy", "generate_report"],
  },
  "code-agent": {
    name: "Code Agent",
    systemPrompt: "You are a senior web developer. Write clean, modern, well-commented code. Specialise in HTML/CSS/JS, React, WordPress, and Webflow. Always explain what the code does.",
    skills: ["query_data", "analyze_website"],
  },
  "ui-ux-advisor": {
    name: "UI/UX Advisor",
    systemPrompt: "You are a UI/UX expert for premium web design. Review designs and provide specific, actionable feedback on layout, typography, colour, UX copy, and accessibility.",
    skills: ["analyze_website", "generate_report"],
  },
  "competitor-analyst": {
    name: "Competitor Analyst",
    systemPrompt: "You analyse competitors for web design agency clients. Break down their website, messaging, pricing, strengths and weaknesses, and identify positioning opportunities.",
    skills: ["competitor_research", "analyze_website", "query_data", "generate_report"],
  },
  "strategy-advisor": {
    name: "Strategy Advisor",
    systemPrompt: "You are a business strategy consultant specialising in creative agencies and their clients. Provide clear, actionable strategic advice grounded in real market realities.",
    skills: ["query_data", "generate_report", "competitor_research", "score_lead"],
  },
  "document-analyst": {
    name: "Document Analyst",
    systemPrompt: "You analyse documents for a web design agency. Extract key requirements, flag important clauses, summarise scope, and identify risks or opportunities.",
    skills: ["query_data", "create_task", "generate_report"],
  },
  "jci-tender-analyst": {
    name: "JCI & Tender Analyst",
    systemPrompt: "You specialise in analysing tenders, grants, and competition briefs. Extract eligibility criteria, scoring rubrics, key deadlines, and provide a step-by-step response strategy.",
    skills: ["query_data", "create_task", "generate_report", "create_proposal"],
  },
  "brand-analyst": {
    name: "Brand Analyst",
    systemPrompt: "You are a brand strategist. Audit brands for consistency, clarity, and market fit. Provide specific recommendations on visual identity, brand voice, and positioning.",
    skills: ["analyze_website", "competitor_research", "generate_report"],
  },
  "performance-reporter": {
    name: "Performance Reporter",
    systemPrompt: "You generate professional performance reports for web design agency clients. Summarise project progress, key metrics, wins, and next steps in a clear, client-friendly format.",
    skills: ["query_data", "generate_report", "draft_email"],
  },
  "website-builder": {
    name: "Website Builder",
    systemPrompt: "You are a multi-agent website builder. When asked to build a website, use the build_website skill with the client name, industry, and description. When asked to edit an existing website, use the edit_website skill with the instructions and the current code. You can also optimize SEO, audit accessibility, add new sections, and generate sitemaps. Always use the appropriate skill — do NOT try to build website code yourself.",
    skills: ["build_website", "edit_website", "optimize_seo", "accessibility_audit", "add_website_section", "generate_sitemap", "analyze_website", "competitor_research", "generate_copy", "query_data"],
  },
};

// All available skill tool definitions
const SKILL_TOOLS: Record<string, any> = {
  create_lead: {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead in the CRM database",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" }, industry: { type: "string" }, url: { type: "string" },
          email: { type: "string" }, city: { type: "string" }, country: { type: "string" },
          score: { type: "number" }, notes: { type: "string" },
        },
        required: ["name"], additionalProperties: false,
      },
    },
  },
  create_task: {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a task in the system",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" }, description: { type: "string" },
          priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
          status: { type: "string", enum: ["To Do", "In Progress", "Done"] },
          assigned_to: { type: "string" }, due_date: { type: "string" },
        },
        required: ["title"], additionalProperties: false,
      },
    },
  },
  update_deal: {
    type: "function",
    function: {
      name: "update_deal",
      description: "Update a pipeline deal",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "string" },
          stage: { type: "string", enum: ["New Lead", "Contacted", "Proposal Sent", "Negotiating", "Closed Won", "Closed Dead"] },
          value: { type: "number" }, next_action: { type: "string" }, notes: { type: "string" },
        },
        required: ["deal_id"], additionalProperties: false,
      },
    },
  },
  query_data: {
    type: "function",
    function: {
      name: "query_data",
      description: "Query the database for records",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", enum: ["leads", "projects", "tasks", "proposals", "clients", "pipeline_deals", "invoices"] },
          limit: { type: "number" },
        },
        required: ["table"], additionalProperties: false,
      },
    },
  },
  draft_email: {
    type: "function",
    function: {
      name: "draft_email",
      description: "Draft a professional email",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" }, subject: { type: "string" }, body: { type: "string" },
          tone: { type: "string", enum: ["formal", "friendly", "urgent", "follow-up"] },
        },
        required: ["subject", "body"], additionalProperties: false,
      },
    },
  },
  create_proposal: {
    type: "function",
    function: {
      name: "create_proposal",
      description: "Create a project proposal",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" }, value: { type: "number" },
          features: { type: "array", items: { type: "string" } },
          industry: { type: "string" }, pages: { type: "number" }, notes: { type: "string" },
        },
        required: ["title"], additionalProperties: false,
      },
    },
  },
  log_outreach: {
    type: "function",
    function: {
      name: "log_outreach",
      description: "Log an outreach activity",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string" },
          method: { type: "string", enum: ["email", "phone", "linkedin", "whatsapp"] },
          subject: { type: "string" }, body_preview: { type: "string" }, template: { type: "string" },
        },
        required: ["method"], additionalProperties: false,
      },
    },
  },
  score_lead: {
    type: "function",
    function: {
      name: "score_lead",
      description: "Score and qualify a lead (return the score in your response)",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string" }, industry: { type: "string" },
          budget_range: { type: "string" }, project_type: { type: "string" },
          urgency: { type: "string", enum: ["low", "medium", "high", "immediate"] },
        },
        required: ["lead_name"], additionalProperties: false,
      },
    },
  },
  analyze_website: {
    type: "function",
    function: {
      name: "analyze_website",
      description: "Analyze a website",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          focus_areas: { type: "array", items: { type: "string", enum: ["design", "seo", "performance", "content", "accessibility"] } },
        },
        required: ["url"], additionalProperties: false,
      },
    },
  },
  competitor_research: {
    type: "function",
    function: {
      name: "competitor_research",
      description: "Research competitors",
      parameters: {
        type: "object",
        properties: {
          company: { type: "string" }, industry: { type: "string" },
          aspects: { type: "array", items: { type: "string", enum: ["pricing", "features", "positioning", "design", "marketing"] } },
        },
        required: ["company"], additionalProperties: false,
      },
    },
  },
  generate_copy: {
    type: "function",
    function: {
      name: "generate_copy",
      description: "Generate marketing copy",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["headline", "tagline", "cta", "about", "landing_page", "social_post", "blog_intro"] },
          brand_voice: { type: "string" }, target_audience: { type: "string" },
          key_message: { type: "string" }, length: { type: "string", enum: ["short", "medium", "long"] },
        },
        required: ["type", "key_message"], additionalProperties: false,
      },
    },
  },
  content_calendar: {
    type: "function",
    function: {
      name: "content_calendar",
      description: "Create a content calendar",
      parameters: {
        type: "object",
        properties: {
          duration_weeks: { type: "number" },
          platforms: { type: "array", items: { type: "string", enum: ["instagram", "linkedin", "facebook", "twitter", "blog"] } },
          industry: { type: "string" }, goals: { type: "string" },
        },
        required: ["duration_weeks", "platforms"], additionalProperties: false,
      },
    },
  },
  generate_report: {
    type: "function",
    function: {
      name: "generate_report",
      description: "Generate a performance report",
      parameters: {
        type: "object",
        properties: {
          report_type: { type: "string", enum: ["weekly", "monthly", "project_status", "pipeline", "lead_performance"] },
          date_range: { type: "string" },
        },
        required: ["report_type"], additionalProperties: false,
      },
    },
  },
  create_project: {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string" }, project_type: { type: "string" },
          brief: { type: "string" }, value: { type: "number" }, deadline: { type: "string" },
        },
        required: ["client_name"], additionalProperties: false,
      },
    },
  },
  create_invoice: {
    type: "function",
    function: {
      name: "create_invoice",
      description: "Create a new invoice",
      parameters: {
        type: "object",
        properties: {
          invoice_number: { type: "string" }, amount: { type: "number" },
          due_date: { type: "string" }, notes: { type: "string" },
        },
        required: ["invoice_number", "amount"], additionalProperties: false,
      },
    },
  },
  build_website: {
    type: "function",
    function: {
      name: "build_website",
      description: "Build a complete website using the multi-agent website builder pipeline (Research → Content → Design → Code). Returns the generated code, design system, research, and content.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Name of the business/client" },
          industry: { type: "string", description: "Industry or sector" },
          description: { type: "string", description: "Description of what the website should be about" },
          pages: { type: "array", items: { type: "string" }, description: "Pages to include (e.g. Home, About, Services, Contact)" },
        },
        required: ["client_name", "industry"], additionalProperties: false,
      },
    },
  },
  edit_website: {
    type: "function",
    function: {
      name: "edit_website",
      description: "Edit an existing website by providing instructions for changes. Requires the current code and design system.",
      parameters: {
        type: "object",
        properties: {
          instructions: { type: "string", description: "What to change about the website" },
          current_code: { type: "string", description: "The current website React component code" },
          client_name: { type: "string" },
          industry: { type: "string" },
        },
        required: ["instructions", "current_code"], additionalProperties: false,
      },
    },
  },
  create_skill: {
    type: "function",
    function: {
      name: "create_skill",
      description: "Create a new agent skill/tool. Use this when the user needs a capability that doesn't exist yet. The skill will be saved and available for all agents.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Human-readable skill name" },
          description: { type: "string", description: "What this skill does" },
          category: { type: "string", enum: ["data", "communication", "research", "content", "analysis", "automation"], description: "Skill category" },
          parameters: {
            type: "object",
            description: "JSON Schema for the skill's parameters (properties, required fields)",
          },
        },
        required: ["name", "description", "category"], additionalProperties: false,
      },
    },
  },
  // ── Site Builder Unique Skills ──
  optimize_seo: {
    type: "function",
    function: {
      name: "optimize_seo",
      description: "Analyze and optimize a website's SEO: meta tags, headings, keywords, alt text, structured data",
      parameters: {
        type: "object",
        properties: {
          current_code: { type: "string", description: "Current website React component code" },
          target_keywords: { type: "array", items: { type: "string" }, description: "Target SEO keywords" },
          client_name: { type: "string" },
          industry: { type: "string" },
        },
        required: ["current_code"], additionalProperties: false,
      },
    },
  },
  accessibility_audit: {
    type: "function",
    function: {
      name: "accessibility_audit",
      description: "Audit a website for WCAG accessibility issues and suggest fixes: contrast, alt text, ARIA labels, keyboard navigation",
      parameters: {
        type: "object",
        properties: {
          current_code: { type: "string", description: "Current website React component code" },
        },
        required: ["current_code"], additionalProperties: false,
      },
    },
  },
  add_website_section: {
    type: "function",
    function: {
      name: "add_website_section",
      description: "Add a new section to an existing website: testimonials, FAQ, pricing, team, portfolio, blog, CTA banner, etc.",
      parameters: {
        type: "object",
        properties: {
          section_type: { type: "string", enum: ["testimonials", "faq", "pricing", "team", "portfolio", "blog", "cta", "stats", "features", "gallery"], description: "Type of section to add" },
          current_code: { type: "string", description: "Current website React component code" },
          content: { type: "string", description: "Content for the section (optional, will be generated if not provided)" },
          position: { type: "string", enum: ["before-footer", "after-hero", "end"], description: "Where to insert the section" },
          client_name: { type: "string" },
          industry: { type: "string" },
        },
        required: ["section_type", "current_code"], additionalProperties: false,
      },
    },
  },
  generate_sitemap: {
    type: "function",
    function: {
      name: "generate_sitemap",
      description: "Generate an XML sitemap and robots.txt for a website based on its sections and pages",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Website domain (e.g. example.com)" },
          pages: { type: "array", items: { type: "string" }, description: "List of page paths" },
          client_name: { type: "string" },
        },
        required: ["domain"], additionalProperties: false,
      },
    },
  },
  simulate_foresight: {
    type: "function",
    function: {
      name: "simulate_foresight",
      description: "Delegate a complex, multi-step goal to the Parallel Society (MiroFish) for deep simulation and strategic foresight. Use this for high-level market analysis, long-term planning, or multi-departmental coordination.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The strategic goal or simulation objective" },
          focus_departments: { type: "array", items: { type: "string" }, description: "Specific departments to prioritize in the simulation" },
        },
        required: ["goal"], additionalProperties: false,
      },
    },
  },
};


const AGENT_LIST = Object.entries(AGENTS)
  .map(([id, a]) => `- ${id}: ${a.name} (skills: ${a.skills.join(", ")})`)
  .join("\n");

async function callAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  tools?: any[],
  toolChoice?: any,
  useOpenRouter = false,
  openRouterModel = "deepseek/deepseek-r1:free",
  provider?: string, // Added provider parameter
) {
  // Handle MiroFish delegation directly
  if (provider === 'mirofish') {
    const MIROFISH_API_BASE = Deno.env.get("VITE_MIROFISH_URL") || "http://localhost:5001";
    // Direct bridge to the MiroFish Python backend
    const response = await fetch(`${MIROFISH_API_BASE}/api/agency/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: userMessage }),
    });
    const data = await response.json();
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            _type: 'mirofish_delegation',
            message: "Task delegated to the Parallel Society.",
            project_id: data.project_id || 'sim-adaptive-01',
            stream_url: `${MIROFISH_API_BASE}/api/agency/stream/${data.project_id}`
          })
        }
      }]
    };

  }

  const isOpenRouter = useOpenRouter && !!Deno.env.get("OPENROUTER_API_KEY");
  const url = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://ai.gateway.lovable.dev/v1/chat/completions";
  const key = isOpenRouter ? Deno.env.get("OPENROUTER_API_KEY")! : apiKey;
  const model = isOpenRouter ? openRouterModel : "google/gemini-2.5-flash";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (isOpenRouter) {
    headers["HTTP-Referer"] = "https://ardeno.studio";
    headers["X-Title"] = "Ardeno OS";
  }

  const body: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  return await res.json();
}

// Auto-disable threshold: if a skill's success rate drops below this after N+ executions, disable it
const AUTO_DISABLE_THRESHOLD = 50; // percent
const MIN_EXECUTIONS_FOR_AUTO_DISABLE = 5;

// Check if a skill is disabled via overrides
async function isSkillDisabled(skillId: string, supabaseClient: any): Promise<boolean> {
  const { data } = await supabaseClient
    .from("skill_overrides")
    .select("enabled")
    .eq("skill_id", skillId)
    .maybeSingle();
  return data ? !data.enabled : false;
}

// Log a skill execution and check for auto-disable
async function logSkillExecution(
  skillId: string,
  skillName: string,
  agentId: string,
  agentName: string,
  success: boolean,
  errorMessage: string | null,
  executionTimeMs: number | null,
  supabaseClient: any
) {
  // Log the execution
  await supabaseClient.from("skill_executions").insert({
    skill_id: skillId,
    skill_name: skillName,
    agent_id: agentId,
    agent_name: agentName,
    success,
    error_message: errorMessage,
    execution_time_ms: executionTimeMs,
  });

  // Check if we should auto-disable this skill
  const { data: executions } = await supabaseClient
    .from("skill_executions")
    .select("success")
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (executions && executions.length >= MIN_EXECUTIONS_FOR_AUTO_DISABLE) {
    const successCount = executions.filter((e: any) => e.success).length;
    const rate = Math.round((successCount / executions.length) * 100);

    if (rate < AUTO_DISABLE_THRESHOLD) {
      // Auto-disable the skill
      const { data: existing } = await supabaseClient
        .from("skill_overrides")
        .select("id")
        .eq("skill_id", skillId)
        .maybeSingle();

      const reason = `Auto-disabled: ${rate}% success rate over last ${executions.length} executions`;

      if (existing) {
        await supabaseClient
          .from("skill_overrides")
          .update({ enabled: false, auto_disabled: true, disabled_reason: reason, updated_at: new Date().toISOString() })
          .eq("skill_id", skillId);
      } else {
        await supabaseClient
          .from("skill_overrides")
          .insert({ skill_id: skillId, enabled: false, auto_disabled: true, disabled_reason: reason });
      }
      console.log(`⚠️ Auto-disabled skill "${skillName}" — ${rate}% success rate`);
    }
  }
}

// Execute a skill tool call against the database
async function executeSkill(
  skillName: string,
  args: Record<string, any>,
  supabaseClient: any,
  agentId: string,
  agentName: string
): Promise<{ success: boolean; result: string }> {
  // Map function name to skill_id format
  const skillId = skillName.replace(/_/g, "-");

  // Check if skill is disabled
  if (await isSkillDisabled(skillId, supabaseClient)) {
    return { success: false, result: `⛔ Skill "${skillName}" is disabled due to low performance. Skipped.` };
  }

  const startTime = Date.now();
  try {
    let result: { success: boolean; result: string };
    switch (skillName) {
      case "create_lead": {
        const { error } = await supabaseClient.from("leads").insert({
          name: args.name, industry: args.industry, url: args.url,
          email: args.email, city: args.city, country: args.country,
          score: args.score, notes: args.notes, status: "New",
        });
        if (error) throw error;
        result = { success: true, result: `✅ Created lead: ${args.name}` };
        break;
      }
      case "create_task": {
        const { error } = await supabaseClient.from("tasks").insert({
          title: args.title, description: args.description,
          priority: args.priority || "Medium", status: args.status || "To Do",
          assigned_to: args.assigned_to, due_date: args.due_date,
        });
        if (error) throw error;
        result = { success: true, result: `✅ Created task: ${args.title}` };
        break;
      }
      case "update_deal": {
        const update: any = {};
        if (args.stage) update.stage = args.stage;
        if (args.value) update.value = args.value;
        if (args.next_action) update.next_action = args.next_action;
        if (args.notes) update.notes = args.notes;
        const { error } = await supabaseClient.from("pipeline_deals").update(update).eq("id", args.deal_id);
        if (error) throw error;
        result = { success: true, result: `✅ Updated deal ${args.deal_id}` };
        break;
      }
      case "query_data": {
        const limit = args.limit || 10;
        const { data, error } = await supabaseClient.from(args.table).select("*").limit(limit);
        if (error) throw error;
        result = { success: true, result: `Found ${data?.length || 0} records:\n${JSON.stringify(data?.slice(0, 5), null, 2)}` };
        break;
      }
      case "create_proposal": {
        const { error } = await supabaseClient.from("proposals").insert({
          title: args.title, value: args.value, features: args.features || [],
          industry: args.industry, pages: args.pages, notes: args.notes,
        });
        if (error) throw error;
        result = { success: true, result: `✅ Created proposal: ${args.title}` };
        break;
      }
      case "log_outreach": {
        const { error } = await supabaseClient.from("outreach_logs").insert({
          lead_id: args.lead_id, method: args.method,
          subject: args.subject, body_preview: args.body_preview, template: args.template,
        });
        if (error) throw error;
        result = { success: true, result: `✅ Logged ${args.method} outreach` };
        break;
      }
      case "create_project": {
        const { error } = await supabaseClient.from("projects").insert({
          client_name: args.client_name, project_type: args.project_type,
          brief: args.brief, value: args.value, deadline: args.deadline,
        });
        if (error) throw error;
        result = { success: true, result: `✅ Created project for ${args.client_name}` };
        break;
      }
      case "create_invoice": {
        const { error } = await supabaseClient.from("invoices").insert({
          invoice_number: args.invoice_number, amount: args.amount,
          due_date: args.due_date, notes: args.notes,
        });
        if (error) throw error;
        result = { success: true, result: `✅ Created invoice ${args.invoice_number}` };
        break;
      }
      // AI-native skills
      case "draft_email":
      case "score_lead":
      case "analyze_website":
      case "competitor_research":
      case "generate_copy":
      case "content_calendar":
      case "generate_report":
        result = { success: true, result: `Agent used skill: ${skillName} with args: ${JSON.stringify(args)}` };
        break;
      // Website builder skills — call the build-website edge function
      case "build_website": {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const buildRes = await fetch(`${SUPABASE_URL}/functions/v1/build-website`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            clientName: args.client_name,
            industry: args.industry || "General",
            description: args.description || "",
            pages: args.pages || ["Home", "About", "Services", "Contact"],
          }),
        });
        const buildData = await buildRes.json();
        if (!buildRes.ok || !buildData.success) throw new Error(buildData.error || "Build failed");
        // Save to generated_websites and get the ID back
        const { data: savedWebsite } = await supabaseClient.from("generated_websites").insert({
          client_name: args.client_name,
          industry: args.industry,
          description: args.description,
          html: buildData.code,
          design: buildData.design,
          research: buildData.research,
          content: buildData.content,
          pages: args.pages || ["Home", "About", "Services", "Contact"],
        }).select("id").single();
        result = {
          success: true,
          result: JSON.stringify({
            _type: "website_build",
            website_id: savedWebsite?.id || null,
            code: buildData.code,
            design: buildData.design,
            research: buildData.research?.slice(0, 500),
            content: buildData.content?.slice(0, 500),
            message: `✅ Website built for ${args.client_name}. ${(buildData.code?.length / 1024).toFixed(1)}KB React + Tailwind component generated.`,
          }),
        };
        break;
      }
      case "edit_website": {
        const SUPABASE_URL2 = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY2 = Deno.env.get("SUPABASE_ANON_KEY")!;
        const editRes = await fetch(`${SUPABASE_URL2}/functions/v1/build-website`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY2, "Authorization": `Bearer ${SUPABASE_ANON_KEY2}` },
          body: JSON.stringify({
            mode: "edit-section",
            sectionId: "full",
            instructions: args.instructions,
            currentCode: args.current_code,
            clientName: args.client_name,
            industry: args.industry,
          }),
        });
        const editData = await editRes.json();
        if (!editRes.ok || !editData.success) throw new Error(editData.error || "Edit failed");
        result = {
          success: true,
          result: JSON.stringify({
            _type: "website_edit",
            code: editData.code,
            message: `✅ Website edited successfully. Applied: ${args.instructions.slice(0, 100)}`,
          }),
        };
        break;
      }
      case "simulate_foresight": {
        const MIROFISH_API_BASE = Deno.env.get("VITE_MIROFISH_URL") || "http://localhost:5001";
        const response = await fetch(`${MIROFISH_API_BASE}/api/agency/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: args.goal, departments: args.focus_departments }),
        });
        const data = await response.json();
        result = {
          success: true,
          result: JSON.stringify({
            _type: 'mirofish_delegation',
            message: "Task delegated to the Parallel Society.",
            project_id: data.project_id || 'sim-adaptive-01',
            stream_url: `${MIROFISH_API_BASE}/api/agency/stream/${data.project_id}`
          })
        };
        break;
      }
      case "create_skill": {
        const skillId = args.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const { error } = await supabaseClient.from("custom_skills").insert({
          skill_id: skillId,
          name: args.name,
          description: args.description || "",
          category: args.category || "automation",
          icon: "Zap",
          enabled: true,
          created_by_orchestrator: true,
          parameters: args.parameters || { type: "object", properties: {}, required: [] },
        });
        if (error) throw error;
        result = { success: true, result: `✅ Created new skill: ${args.name} (${skillId}) in category ${args.category}` };
        break;
      }
      // ── Site Builder Unique Skills ──
      case "optimize_seo": {
        const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;
        const seoResult = await callAI(
          "You are an SEO expert. Analyze the website code and return a JSON object with: { title, metaDescription, keywords[], headingStructure[], issues[], recommendations[] }. Be specific to the business and industry.",
          `Analyze SEO for ${args.client_name || "this website"} in ${args.industry || "general"} industry.\n\nCode:\n${(args.current_code || "").slice(0, 6000)}\n\nTarget keywords: ${(args.target_keywords || []).join(", ")}`,
          LOVABLE_KEY,
          undefined, undefined, false
        );
        const seoContent = seoResult.choices?.[0]?.message?.content || "No SEO analysis generated";
        result = { success: true, result: `✅ SEO Analysis Complete:\n${seoContent}` };
        break;
      }
      case "accessibility_audit": {
        const LOVABLE_KEY2 = Deno.env.get("LOVABLE_API_KEY")!;
        const a11yResult = await callAI(
          "You are a WCAG accessibility expert. Audit the website code and return: { score: 0-100, issues: [{severity, element, issue, fix}], passedChecks: string[] }. Check contrast, alt text, ARIA labels, keyboard navigation, semantic HTML, focus management.",
          `Audit accessibility:\n${(args.current_code || "").slice(0, 6000)}`,
          LOVABLE_KEY2,
          undefined, undefined, false
        );
        const a11yContent = a11yResult.choices?.[0]?.message?.content || "No audit generated";
        result = { success: true, result: `✅ Accessibility Audit:\n${a11yContent}` };
        break;
      }
      case "add_website_section": {
        const SUPABASE_URL3 = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY3 = Deno.env.get("SUPABASE_ANON_KEY")!;
        const sectionInstructions = `Add a ${args.section_type} section ${args.position === "after-hero" ? "right after the hero section" : args.position === "end" ? "at the end before the footer" : "before the footer"}. ${args.content ? `Use this content: ${args.content}` : `Generate appropriate ${args.section_type} content for a ${args.industry || "general"} business called "${args.client_name || "the client"}".`} Make it visually distinct from surrounding sections.`;
        const addRes = await fetch(`${SUPABASE_URL3}/functions/v1/build-website`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY3, "Authorization": `Bearer ${SUPABASE_ANON_KEY3}` },
          body: JSON.stringify({
            mode: "edit-section",
            sectionId: "full",
            instructions: sectionInstructions,
            currentCode: args.current_code,
            clientName: args.client_name,
            industry: args.industry,
          }),
        });
        const addData = await addRes.json();
        if (!addRes.ok || !addData.success) throw new Error(addData.error || "Add section failed");
        result = {
          success: true,
          result: JSON.stringify({
            _type: "website_edit",
            code: addData.code,
            message: `✅ Added ${args.section_type} section ${args.position || "before footer"}`,
          }),
        };
        break;
      }
      case "generate_sitemap": {
        const pages = args.pages || ["/", "/about", "/services", "/contact"];
        const domain = args.domain || "example.com";
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p: string) => `  <url>\n    <loc>https://${domain}${p.startsWith("/") ? p : "/" + p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p === "/" ? "1.0" : "0.8"}</priority>\n  </url>`).join("\n")}\n</urlset>`;
        const robots = `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml`;
        result = { success: true, result: `✅ Generated sitemap for ${domain}:\n\n**sitemap.xml:**\n\`\`\`xml\n${sitemap}\n\`\`\`\n\n**robots.txt:**\n\`\`\`\n${robots}\n\`\`\`` };
        break;
      }
      default:
        // Check if it's a custom skill — just log it as AI-handled
        result = { success: true, result: `Agent used custom skill: ${skillName} with args: ${JSON.stringify(args)}` };
    }

    const elapsed = Date.now() - startTime;
    // Log execution asynchronously (don't block)
    logSkillExecution(skillId, skillName, agentId, agentName, result.success, null, elapsed, supabaseClient).catch(console.error);
    return result;
  } catch (e) {
    const elapsed = Date.now() - startTime;
    const errMsg = e instanceof Error ? e.message : "Unknown";
    logSkillExecution(skillId, skillName, agentId, agentName, false, errMsg, elapsed, supabaseClient).catch(console.error);
    return { success: false, result: `Skill error (${skillName}): ${errMsg}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, context, provider: requestedProvider, model: requestedModel } = await req.json();
    if (!task) {
      return new Response(JSON.stringify({ error: "task is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useOpenRouter = requestedProvider === "openrouter" || !!Deno.env.get("OPENROUTER_API_KEY");
    const openRouterModel = requestedModel || "deepseek/deepseek-r1:free";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY && !useOpenRouter && requestedProvider !== "mirofish") throw new Error("No AI provider configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Load custom agents from DB
    const { data: customAgentsData } = await supabaseClient
      .from("custom_agents")
      .select("*")
      .eq("enabled", true);

    // Load custom skills from DB
    const { data: customSkillsData } = await supabaseClient
      .from("custom_skills")
      .select("*")
      .eq("enabled", true);

    // Register custom skills as tool definitions
    for (const cs of (customSkillsData || [])) {
      const toolName = cs.skill_id.replace(/-/g, "_");
      if (!SKILL_TOOLS[toolName]) {
        SKILL_TOOLS[toolName] = {
          type: "function",
          function: {
            name: toolName,
            description: cs.description || cs.name,
            parameters: cs.parameters || { type: "object", properties: {}, required: [] },
          },
        };
      }
    }

    // Merge built-in + custom agents
    const allAgents: Record<string, { name: string; systemPrompt: string; skills: string[] }> = { ...AGENTS };
    for (const ca of (customAgentsData || [])) {
      allAgents[ca.agent_id] = {
        name: ca.name,
        systemPrompt: ca.system_prompt,
        skills: ca.skills || [],
      };
    }

    // Load disabled skills to filter them out
    const { data: disabledOverrides } = await supabaseClient
      .from("skill_overrides")
      .select("skill_id")
      .eq("enabled", false);
    const disabledSkillIds = new Set((disabledOverrides ?? []).map((o: any) => o.skill_id.replace(/-/g, "_")));

    // Filter agent skills before planning
    const filteredAgents: Record<string, typeof AGENTS[string]> = {};
    for (const [id, agent] of Object.entries(allAgents)) {
      filteredAgents[id] = {
        ...agent,
        skills: agent.skills.filter(s => !disabledSkillIds.has(s)),
      };
    }

    const FILTERED_AGENT_LIST = Object.entries(filteredAgents)
      .map(([id, a]) => `- ${id}: ${a.name} (skills: ${a.skills.join(", ")})`)
      .join("\n");

    // Step 1: Orchestrator creates plan with tool calling
    const planPrompt = `You are the master AI coordinator for Ardeno Studio, a high-end web design agency.
Your job is to break down a user's task into sub-tasks and assign each to the best specialist agent.
Each agent has specific skills (tools) they can use to take real actions.

Available agents and their skills:
${FILTERED_AGENT_LIST}

IMPORTANT: You also have a meta-skill "create_skill" — if the user asks for a capability that NO existing agent/skill covers, you should assign the orchestrator-prime agent a task to create a new skill using the create_skill tool.

Analyse the task and create a plan. Assign each sub-task to exactly one agent.
Be practical — only use agents actually needed. If one agent can handle it, just assign to one.
All agents will run IN PARALLEL so each sub-task should be independent.
Mention which skills the agent should use in the task description if relevant.`;

    const planTools = [{
      type: "function",
      function: {
        name: "create_plan",
        description: "Create a task breakdown plan with agent assignments",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Brief summary of the overall plan" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent_id: { type: "string", description: "The agent ID" },
                  task: { type: "string", description: "What this agent should do" },
                  order: { type: "number", description: "Execution order (1-based)" },
                  skills_to_use: { type: "array", items: { type: "string" }, description: "Which skills the agent should use" },
                },
                required: ["agent_id", "task", "order"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "steps"],
          additionalProperties: false,
        },
      },
    }];

    const contextStr = context ? `\n\nAdditional context: ${context}` : "";
    const planResult = await callAI(
      planPrompt,
      `Task: ${task}${contextStr}`,
      LOVABLE_API_KEY || "",
      planTools,
      { type: "function", function: { name: "create_plan" } },
      useOpenRouter,
      openRouterModel
    );

    const toolCall = planResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Orchestrator failed to create a plan");

    const plan = JSON.parse(toolCall.function.arguments);

    // Step 2: Execute ALL agents in PARALLEL
    const agentPromises = plan.steps.map(async (step: any) => {
      const agent = filteredAgents[step.agent_id];
      if (!agent) {
        return {
          agent_id: step.agent_id, agent_name: step.agent_id,
          task: step.task, order: step.order,
          result: `Agent "${step.agent_id}" not found. Skipped.`,
          error: true, skills_used: [],
        };
      }

      try {
        // Get the agent's skill tools
        const agentSkillTools = agent.skills
          .map((s) => SKILL_TOOLS[s])
          .filter(Boolean);

        // Enhance system prompt with skill awareness
        const enhancedPrompt = `${agent.systemPrompt}\n\nYou have access to the following skills/tools. Use them when appropriate to take real actions:\n${agent.skills.map((s) => `- ${s}`).join("\n")}\n\nAfter using any tools, always provide a complete written response summarising what you did and the results.`;

        const agentResult = await callAI(
          enhancedPrompt,
          `${step.task}${contextStr}`,
          LOVABLE_API_KEY || "",
          agentSkillTools.length > 0 ? agentSkillTools : undefined,
          undefined,
          useOpenRouter,
          openRouterModel
        );

        const message = agentResult.choices?.[0]?.message;
        let content = message?.content || "";
        const skillsUsed: string[] = [];

        // Execute any tool calls the agent made
        if (message?.tool_calls) {
          for (const tc of message.tool_calls) {
            const args = JSON.parse(tc.function.arguments);
            const skillResult = await executeSkill(tc.function.name, args, supabaseClient, step.agent_id, agent.name);
            skillsUsed.push(tc.function.name);
            content += `\n\n**Skill Used: ${tc.function.name}**\n${skillResult.result}`;
          }
        }

        if (!content) content = "No response generated.";

        return {
          agent_id: step.agent_id, agent_name: agent.name,
          task: step.task, order: step.order,
          result: content, error: false,
          skills_used: skillsUsed,
        };
      } catch (e) {
        return {
          agent_id: step.agent_id, agent_name: agent.name,
          task: step.task, order: step.order,
          result: e instanceof Error ? e.message : "Unknown error",
          error: true, skills_used: [],
        };
      }
    });

    const results = await Promise.all(agentPromises);
    // Sort by order for display
    results.sort((a: any, b: any) => a.order - b.order);

    return new Response(
      JSON.stringify({ plan, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("orchestrate error:", e);
    const status = (e as any)?.message?.includes("429") ? 429 :
                   (e as any)?.message?.includes("402") ? 402 : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
