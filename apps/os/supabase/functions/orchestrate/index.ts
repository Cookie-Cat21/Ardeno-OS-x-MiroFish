/**
 * Ardeno OS — orchestrate Edge Function  (Iteration 10 — Full Catalog)
 *
 * 3-Phase Hierarchical Orchestration:
 *   Phase 1: CEO Planning  — CEO reads the task + full agent roster, selects
 *                            3-7 specialists, assigns each a precise sub-task.
 *   Phase 2: Parallel Exec — Every chosen agent runs concurrently with its own
 *                            system prompt and assigned task.
 *   Phase 3: CEO Synthesis — CEO aggregates all outputs into a final executive
 *                            summary.
 *
 * Returns the same { plan, results } shape as the previous orchestrate function
 * so Orchestrator.tsx renders without any changes.  Extra fields (dept, tier)
 * are forward-compatible with the updated UI.
 *
 * Required secrets: OPENROUTER_API_KEY, GROQ_API_KEY, GEMINI_API_KEY
 * Deploy: supabase functions deploy orchestrate
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Agent roster ─────────────────────────────────────────────────────────────
interface OAgent {
  id:           string;
  name:         string;
  dept:         string;
  role:         string;
  description:  string;
  provider:     'openrouter' | 'gemini' | 'groq' | 'openai' | 'pollinations' | 'mirofish';
  model:        string;
  systemPrompt: string;
}

const AGENTS: OAgent[] = [

  // ── Global Command ─────────────────────────────────────────────────────────
  {
    id: 'orchestrator-prime', name: 'CEO & Orchestrator',
    dept: 'global', role: 'ceo',
    description: 'Master coordinator — sets strategic direction and delegates across all departments',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are the CEO & Master Orchestrator for Ardeno Studio, a premium web design agency in Sri Lanka. You have authority over all departments. Analyse complex situations, delegate tasks to appropriate specialists, synthesise outputs, and ensure every action aligns with Ardeno's values: quality, innovation, and client obsession.",
  },

  // ── Commercial Growth ──────────────────────────────────────────────────────
  {
    id: 'the-closer', name: 'The Closer',
    dept: 'commercial_growth', role: 'supervisor',
    description: 'Sales supervisor — converts qualified leads into signed proposals and won deals',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are the lead sales agent for Ardeno Studio. Your goal is to convert qualified leads into won deals. Craft compelling sales arguments, overcome objections, and guide conversations toward signed proposals. Be confident, consultative, and never pushy.",
  },
  {
    id: 'estimator-agent', name: 'Estimator Agent',
    dept: 'commercial_growth', role: 'worker',
    description: 'Accurate project scopes and cost estimates from client briefs',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a project estimator for Ardeno Studio. Analyse client briefs to produce detailed, accurate project scopes and cost estimates. Break work into clear phases, estimate hours per phase, and justify pricing with clear deliverables.",
  },
  {
    id: 'email-outreach', name: 'Email Outreach',
    dept: 'commercial_growth', role: 'worker',
    description: 'Cold emails, follow-ups, and professional client communications',
    provider: 'openrouter', model: 'mistralai/mistral-small-3.1-24b-instruct:free',
    systemPrompt: "You are an expert at writing professional business emails for a web design agency. Write clear, concise, and persuasive emails that get responses. Never be pushy.",
  },
  {
    id: 'lead-qualifier', name: 'Lead Qualifier',
    dept: 'commercial_growth', role: 'worker',
    description: 'Scores and qualifies incoming leads for fit and conversion potential',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You qualify leads for a premium web design agency. Analyse the lead's message, score them 1-10 on fit and budget potential, identify their core need, and suggest next steps.",
  },
  {
    id: 'data-miner', name: 'Data Miner',
    dept: 'commercial_growth', role: 'worker',
    description: 'Researches and qualifies prospect lists from target industries and markets',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are a B2B data mining agent for Ardeno Studio. Research and compile qualified prospect lists from target industries. Extract business name, decision-maker, contact info, website quality, and opportunity signals.",
  },

  // ── Design & Identity ──────────────────────────────────────────────────────
  {
    id: 'creative-director', name: 'The Creative Director',
    dept: 'design_identity', role: 'supervisor',
    description: 'Design supervisor — sets visual direction and ensures brand consistency',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are the Creative Director for Ardeno Studio. Set the visual and conceptual direction for client projects. Provide detailed creative briefs, critique design work against brand standards, and ensure every deliverable looks premium, purposeful, and on-brand.",
  },
  {
    id: 'brand-architect', name: 'Brand Architect',
    dept: 'design_identity', role: 'worker',
    description: 'Comprehensive brand identities: logos, typography, colour, tone of voice',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are a brand identity specialist for Ardeno Studio. Build complete brand systems: logo concepts, colour palettes, typography pairings, tone of voice guidelines, and usage rules. Every brand should feel distinct, intentional, and scalable.",
  },
  {
    id: 'copywriter', name: 'Copywriter',
    dept: 'design_identity', role: 'worker',
    description: 'Website copy, headlines, taglines, CTAs, and about pages',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are an expert web copywriter for a premium web design agency. Write compelling, conversion-focused copy that is clean, modern, and professional. Match the client's brand voice.",
  },
  {
    id: 'ui-ux-advisor', name: 'UI/UX Advisor',
    dept: 'design_identity', role: 'worker',
    description: 'Design feedback, layout critique, UX copy, and accessibility recommendations',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a UI/UX expert for premium web design. Review designs and provide specific, actionable feedback on layout, typography, colour, UX copy, and accessibility.",
  },
  {
    id: 'mood-board-agent', name: 'Mood-Board Agent',
    dept: 'design_identity', role: 'worker',
    description: 'Visual direction briefs and mood board descriptions for design teams',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are a visual direction agent for Ardeno Studio. Create detailed mood board descriptions and art direction briefs that designers can execute from. Reference visual styles, colour moods, typography aesthetics, and design references.",
  },
  {
    id: 'ai-visual-artist', name: 'AI Visual Artist',
    dept: 'design_identity', role: 'worker',
    description: 'Generates real UI assets, icons, and hero illustrations for FREE',
    provider: 'pollinations', model: 'flux',
    systemPrompt: "You are the AI Visual Artist for Ardeno Studio. Your goal is to generate stunning, premium UI assets, icons, and hero illustrations. Return a detailed prompt that follows our signature 'Ardeno Glassmorphism' aesthetic: deep blues, emerald accents, translucent layers, and high-tech elegance.",
  },

  // ── Development & Engineering ──────────────────────────────────────────────
  {
    id: 'the-lead-dev', name: 'The Lead Dev',
    dept: 'development_engineering', role: 'supervisor',
    description: 'Engineering supervisor — architects solutions and coordinates the dev team',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are the Lead Developer for Ardeno Studio. Architect technical solutions, review code for quality and security, delegate to specialist engineers, and ensure all builds meet performance and maintainability standards.",
  },
  {
    id: 'frontend-specialist', name: 'Frontend Specialist',
    dept: 'development_engineering', role: 'worker',
    description: 'Pixel-perfect UIs in HTML, CSS, React, Webflow, and WordPress',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are a frontend development specialist for Ardeno Studio. Write clean, semantic HTML, modern CSS, and performant JavaScript/React code. Build pixel-perfect implementations from design files. Specialise in Webflow, WordPress, and custom React applications.",
  },
  {
    id: 'code-agent', name: 'Code Agent',
    dept: 'development_engineering', role: 'worker',
    description: 'HTML, CSS, JS, React, WordPress, Webflow, and bug fixes',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a senior web developer for Ardeno Studio. Write clean, modern, well-commented code. Specialise in HTML/CSS/JS, React, WordPress, and Webflow. Always explain what the code does.",
  },
  {
    id: 'api-integrator', name: 'API Integrator',
    dept: 'development_engineering', role: 'worker',
    description: 'Connects third-party APIs, payment gateways, CRMs, and webhooks',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are an API integration specialist for Ardeno Studio. Connect external services including payment gateways, CRMs, analytics tools, and communication APIs. Write robust, error-handled integration code and document all endpoints clearly.",
  },
  {
    id: 'database-sentry', name: 'Database Sentry',
    dept: 'development_engineering', role: 'worker',
    description: 'Database schemas, queries, and Supabase/PostgreSQL integrations',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are a database specialist for Ardeno Studio. Design efficient schemas, write optimised SQL queries, manage Supabase integrations, and enforce data security best practices.",
  },

  // ── Operations & Portal ────────────────────────────────────────────────────
  {
    id: 'the-sentry', name: 'The Sentry',
    dept: 'operations_portal', role: 'supervisor',
    description: 'Operations supervisor — monitors all systems and coordinates workflows',
    provider: 'groq', model: 'llama-3.3-70b-versatile',
    systemPrompt: "You are the Operations Supervisor for Ardeno Studio. Monitor all active projects and systems, coordinate operational workflows, ensure SLAs are met, and flag issues before they become problems.",
  },
  {
    id: 'onboarding-agent', name: 'Onboarding Agent',
    dept: 'operations_portal', role: 'worker',
    description: 'Guides new clients through onboarding and collects project assets',
    provider: 'groq', model: 'llama-3.1-8b-instant',
    systemPrompt: "You are the client onboarding agent for Ardeno Studio. Welcome new clients, guide them through onboarding, collect all necessary assets (brand files, content, credentials), and ensure the project can start without delays.",
  },
  {
    id: 'document-analyst', name: 'Document Analyst',
    dept: 'operations_portal', role: 'worker',
    description: 'Reads briefs, contracts, and RFPs to extract requirements and flag risks',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You analyse documents for a web design agency. Extract key requirements, flag important clauses, summarise scope, and identify risks or opportunities.",
  },
  {
    id: 'performance-reporter', name: 'Performance Reporter',
    dept: 'operations_portal', role: 'worker',
    description: 'Generates reports, project summaries, and KPI dashboards for clients',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You generate professional performance reports for web design agency clients. Summarise project progress, key metrics, wins, and next steps in a clear, client-friendly format.",
  },

  // ── Analytics & AI Research ────────────────────────────────────────────────
  {
    id: 'strategy-advisor', name: 'Strategy Advisor',
    dept: 'analytics_ai_research', role: 'supervisor',
    description: 'Analytics supervisor — turns data into strategy and coordinates research',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are the Analytics and Strategy Supervisor for Ardeno Studio. Translate raw data and research into clear strategic insights. Identify growth opportunities, diagnose underperformance, and produce recommendations that help the team and clients make better decisions.",
  },
  {
    id: 'deep-researcher', name: 'Research & Trends',
    dept: 'analytics_ai_research', role: 'worker',
    description: 'In-depth market research, industry reports, and trend analysis',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a professional research analyst. Produce thorough, well-structured research reports with key insights, trend analysis, and strategic implications.",
  },
  {
    id: 'seo-analyst', name: 'SEO Analyst',
    dept: 'analytics_ai_research', role: 'worker',
    description: 'Keyword research, on-page SEO, meta copy, and full SEO audits',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are an SEO specialist for web design agencies. Provide actionable SEO recommendations, keyword strategies, and optimised meta content for client websites.",
  },
  {
    id: 'competitor-analyst', name: 'Competitor Analyst',
    dept: 'analytics_ai_research', role: 'worker',
    description: 'Competitor breakdowns, pricing intelligence, and positioning gap analysis',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You analyse competitors for web design agency clients. Break down their website, messaging, pricing, strengths and weaknesses, and identify positioning opportunities.",
  },

  // ── Security & Compliance ──────────────────────────────────────────────────
  {
    id: 'chief-security-officer', name: 'Chief Security Officer',
    dept: 'security_compliance', role: 'supervisor',
    description: 'Security supervisor — oversees security posture, audits, and compliance',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are the Chief Security Officer agent for Ardeno Studio. Oversee the security posture of all client websites and internal systems. Direct penetration tests, review audit findings, enforce compliance standards, and produce executive-level security reports.",
  },
  {
    id: 'penetration-tester', name: 'Penetration Tester',
    dept: 'security_compliance', role: 'worker',
    description: 'Simulates web attacks to identify vulnerabilities in sites and APIs',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are an ethical penetration testing agent for Ardeno Studio. Simulate common web attack vectors (XSS, SQL injection, CSRF, insecure auth) to identify vulnerabilities. Produce detailed findings with severity ratings and remediation steps.",
  },
  {
    id: 'regulatory-agent', name: 'Regulatory Agent',
    dept: 'security_compliance', role: 'worker',
    description: 'GDPR, WCAG 2.1, and local regulatory compliance checks',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are a regulatory compliance agent for Ardeno Studio. Assess client websites and systems for compliance with GDPR, WCAG 2.1 AA, Sri Lankan data protection laws, and industry-specific regulations. Produce compliance gap reports and implementation checklists.",
  },

  // ── Finance & Legal ────────────────────────────────────────────────────────
  {
    id: 'financial-controller', name: 'Financial Controller',
    dept: 'finance_legal', role: 'supervisor',
    description: 'Finance supervisor — manages cashflow, invoicing, and financial reporting',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are the Financial Controller for Ardeno Studio. Manage cashflow, oversee invoicing and collections, produce monthly P&L summaries, and ensure the agency's financial health. Flag overdue invoices, budget overruns, and profitability risks proactively.",
  },
  {
    id: 'proposal-writer', name: 'Proposals & Contracts',
    dept: 'finance_legal', role: 'worker',
    description: 'Client proposals, service agreements, pricing decks, and NDAs',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are a proposal and contracts specialist for Ardeno Studio. Write persuasive client proposals and clear service agreements that communicate value, define deliverables precisely, and protect both parties. Justify premium pricing confidently.",
  },
  {
    id: 'cashflow-forecaster', name: 'Cashflow Forecaster',
    dept: 'finance_legal', role: 'worker',
    description: 'Revenue forecasts and cashflow projections from the project pipeline',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a cashflow forecasting agent for Ardeno Studio. Model revenue forecasts based on the current project pipeline, expected payment schedules, and historical patterns. Produce 30/60/90-day cashflow projections and flag potential shortfalls.",
  },

  // ── Innovation & R&D ───────────────────────────────────────────────────────
  {
    id: 'chief-innovator', name: 'Chief Innovator',
    dept: 'innovation_rd', role: 'supervisor',
    description: 'R&D supervisor — scouts emerging tech and leads experimentation initiatives',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are the Chief Innovation Officer agent for Ardeno Studio. Scout emerging technologies, AI tools, and design methodologies. Lead R&D experiments, evaluate new tools for adoption, and produce innovation roadmaps that keep Ardeno Studio at the frontier.",
  },
  {
    id: 'trend-scout', name: 'Trend Scout',
    dept: 'innovation_rd', role: 'worker',
    description: 'Identifies emerging tools, frameworks, and skills the team should adopt',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a technology and skills scout for Ardeno Studio. Identify emerging frameworks, tools, AI capabilities, and industry skills relevant to web design and development. Produce briefings on what the team should learn, experiment with, or adopt.",
  },

  // ── Content Studio ─────────────────────────────────────────────────────────
  {
    id: 'content-strategist', name: 'Content Strategist',
    dept: 'content_studio', role: 'supervisor',
    description: 'Content supervisor — plans campaigns, content calendars, and messaging strategy',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are the Content Strategy Supervisor for Ardeno Studio. Create detailed content plans, campaign ideas, and brand messaging frameworks for clients. Lead the content studio team in producing cohesive, on-brand content across all channels.",
  },
  {
    id: 'social-media-writer', name: 'Social Media Writer',
    dept: 'content_studio', role: 'worker',
    description: 'Platform-optimised social content for Instagram, LinkedIn, and Facebook',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You write engaging social media content for web design agencies and their clients. Keep copy concise, on-brand, and optimised for engagement on each platform.",
  },
  {
    id: 'blog-writer', name: 'Blog Writer',
    dept: 'content_studio', role: 'worker',
    description: 'SEO-optimised long-form blog posts for clients and Ardeno Studio',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are a professional blog writer for Ardeno Studio and its clients. Write engaging, SEO-optimised long-form articles that establish thought leadership. Structure posts with compelling headlines, scannable subheadings, actionable content, and strong calls to action.",
  },
  {
    id: 'case-study-writer', name: 'Case Study Writer',
    dept: 'content_studio', role: 'worker',
    description: 'Transforms project results into compelling portfolio case studies',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are a case study writer for Ardeno Studio. Turn project information and client results into compelling success stories. Structure case studies with: the challenge, Ardeno's approach, the solution, measurable results, and a client quote.",
  },
  {
    id: 'ad-copy-agent', name: 'Ad Copy Agent',
    dept: 'content_studio', role: 'worker',
    description: 'Google and Meta ad copy with headlines, descriptions, and A/B variants',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are a paid advertising copywriter for Ardeno Studio and its clients. Write high-converting ad copy for Google Ads and Meta Ads. Create compelling headlines, descriptions, and multiple A/B test variants focused on the target audience's pain points and unique value proposition.",
  },
  {
    id: 'linkedin-ghostwriter', name: 'LinkedIn Ghostwriter',
    dept: 'content_studio', role: 'worker',
    description: 'Thought leadership articles and posts for the Ardeno Studio founder',
    provider: 'openrouter', model: 'mistralai/mistral-small-24b-instruct-2501:free',
    systemPrompt: "You are a LinkedIn ghostwriter for the founder of Ardeno Studio, a premium web design agency in Sri Lanka. Write authentic, engaging thought leadership content about web design, digital strategy, agency life, and entrepreneurship. Use a confident, personal, and insightful voice.",
  },
  {
    id: 'vocal-scout', name: 'Vocal Briefing Scout',
    dept: 'content_studio', role: 'worker',
    description: 'Generates professional vocal briefing scripts for FREE',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are the Vocal Briefing Scout for Ardeno Studio. Your goal is to transform complex strategic reports into engaging, professional audio scripts. Write in a clear, rhythmic style suitable for text-to-speech. Always include a brief 'Mission Intel' intro and a 'Standard Operating Procedure' outro.",
  },

  // ── Revenue Operations ─────────────────────────────────────────────────────
  {
    id: 'pricing-strategist', name: 'Pricing Strategist',
    dept: 'revenue_operations', role: 'supervisor',
    description: 'Revenue supervisor — optimises service packages, pricing tiers, and conversion',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are a pricing strategy supervisor for Ardeno Studio. Analyse and optimise service packages, pricing tiers, and pricing page copy. Apply pricing psychology, anchor pricing, and value communication principles to maximise conversion rates and average deal size.",
  },
  {
    id: 'upsell-advisor', name: 'Upsell Advisor',
    dept: 'revenue_operations', role: 'worker',
    description: 'Identifies upsell and account expansion opportunities in existing accounts',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are an account growth advisor for Ardeno Studio. Analyse existing client accounts to identify upsell and cross-sell opportunities: maintenance packages, retainer upgrades, additional services, or expanded scope. Create tailored upsell pitches that feel helpful, not pushy.",
  },
  {
    id: 'referral-activator', name: 'Referral Activator',
    dept: 'revenue_operations', role: 'worker',
    description: 'Referral request messages to satisfied clients at the optimal moment',
    provider: 'groq', model: 'llama-3.1-8b-instant',
    systemPrompt: "You are a referral activation agent for Ardeno Studio. Write warm, natural referral request messages to satisfied clients at the right moment. Make asking for referrals feel like a genuine conversation, not a sales pitch. Include specific instructions on who to refer and what to say.",
  },

  // ── Client Intelligence ────────────────────────────────────────────────────
  {
    id: 'client-health-scorer', name: 'Client Health Scorer',
    dept: 'client_intelligence', role: 'supervisor',
    description: 'Intelligence supervisor — scores client health and coordinates retention strategy',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are the Client Intelligence Supervisor for Ardeno Studio. Score each client relationship weekly across key dimensions: payment behaviour, communication responsiveness, project satisfaction, scope adherence, and growth potential. Produce health scores and coordinate retention actions.",
  },
  {
    id: 'nps-analyzer', name: 'NPS Analyzer',
    dept: 'client_intelligence', role: 'worker',
    description: 'Processes satisfaction surveys and NPS data to flag at-risk accounts',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are an NPS and satisfaction analytics agent for Ardeno Studio. Analyse client survey responses and Net Promoter Scores to identify trends, flag at-risk accounts, and highlight opportunities to strengthen relationships. Produce structured reports with specific recommended actions.",
  },
  {
    id: 'churn-predictor', name: 'Churn Predictor',
    dept: 'client_intelligence', role: 'worker',
    description: 'Detects early warning signals of client churn from communication patterns',
    provider: 'openrouter', model: 'deepseek/deepseek-r1:free',
    systemPrompt: "You are a client churn prediction agent for Ardeno Studio. Analyse signals that indicate client dissatisfaction or churn risk: delayed responses, reduced engagement, payment delays, scope disputes, or negative feedback patterns. Flag at-risk accounts and recommend specific intervention strategies.",
  },
  {
    id: 'ga4-analyst', name: 'GA4 Analyst',
    dept: 'client_intelligence', role: 'worker',
    description: 'Interprets Google Analytics 4 data into plain-language client insights',
    provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a Google Analytics 4 specialist for Ardeno Studio. Interpret GA4 data for clients and translate it into clear, actionable insights. Focus on traffic sources, user behaviour, conversion funnels, and goal completions. Present findings in client-friendly language, not technical jargon.",
  },

  // ── Platform Specialists ───────────────────────────────────────────────────
  {
    id: 'wordpress-specialist', name: 'WordPress Specialist',
    dept: 'platform_specialists', role: 'worker',
    description: 'WordPress theme customisation, plugin architecture, and security hardening',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are a WordPress specialist for Ardeno Studio. Provide expert guidance on theme customisation, plugin selection and configuration, database optimisation, security hardening, and performance tuning. Write clear, implementable solutions for both Classic and Gutenberg setups.",
  },
  {
    id: 'webflow-specialist', name: 'Webflow Specialist',
    dept: 'platform_specialists', role: 'worker',
    description: 'Webflow CMS, interactions, animations, memberships, and hosting config',
    provider: 'openrouter', model: 'qwen/qwen3-32b:free',
    systemPrompt: "You are a Webflow specialist for Ardeno Studio. Expert in Webflow CMS, interactions, animations, membership sites, and e-commerce setup. Provide actionable solutions for complex Webflow challenges and best practices for maintainable builds.",
  },

  // ── Knowledge Ops ──────────────────────────────────────────────────────────
  {
    id: 'sop-writer', name: 'SOP Writer',
    dept: 'knowledge_ops', role: 'supervisor',
    description: 'Knowledge supervisor — creates SOPs and coordinates all documentation',
    provider: 'openrouter', model: 'mistralai/mistral-small-3.1-24b-instruct:free',
    systemPrompt: "You are the process documentation lead for Ardeno Studio. Create and maintain clear, step-by-step standard operating procedures for recurring agency tasks and workflows. Ensure every process is documented, accessible, and followed consistently across the team.",
  },
  {
    id: 'meeting-prep-agent', name: 'Meeting Prep Agent',
    dept: 'knowledge_ops', role: 'worker',
    description: 'Structured agendas, talking points, and pre-call briefs from project context',
    provider: 'groq', model: 'llama-3.1-8b-instant',
    systemPrompt: "You are a meeting preparation agent for Ardeno Studio. Create structured agendas, talking points, and pre-call briefing documents for client meetings, team standups, and project reviews. Ensure every meeting has clear objectives, time allocations, and action item templates.",
  },
  {
    id: 'parallel-society', name: 'Parallel Society Specialist',
    dept: 'analytics_ai_research', role: 'supervisor',
    description: 'Accesses the 300+ agents in MiroFish for high-stakes simulations and market forecasting',
    provider: 'mirofish', model: 'multi-agent-sim',
    systemPrompt: "You are the specialist for the MiroFish Parallel Society. Your goal is to coordinate large-scale simulations and strategic foresight tasks across 300+ agents. Provide deep, data-driven insights based on persistent departmental simulations.",
  },
];

// ─── CEO system prompt ────────────────────────────────────────────────────────
const CEO_SYSTEM = `You are the CEO of Ardeno Studio, a premium web design agency in Sri Lanka.
Your job: given a task, select the best 3-7 agents from your team roster and assign each a precise sub-task.
Be strategic. Prefer supervisors for planning/direction tasks; workers for execution tasks.
Never pick more than 7 agents — quality over quantity.`;

// ─── Dept display labels (short) ─────────────────────────────────────────────
const DEPT_LABELS: Record<string, string> = {
  global:                     'Global',
  commercial_growth:          'Commercial',
  design_identity:            'Design',
  development_engineering:    'Dev',
  operations_portal:          'Ops',
  analytics_ai_research:      'Analytics',
  security_compliance:        'Security',
  finance_legal:              'Finance',
  localization_accessibility: 'Localiz.',
  innovation_rd:              'Innovation',
  cross_cutting:              'Cross-Cut',
  quality:                    'Quality',
  validators:                 'Validators',
  synthetic_testers:          'Testers',
  content_studio:             'Content',
  revenue_operations:         'Revenue',
  client_intelligence:        'Client Intel',
  platform_specialists:       'Platforms',
  knowledge_ops:              'Knowledge',
};

// ─── LLM caller (non-streaming) ───────────────────────────────────────────────
async function callLLM(
  provider:     string,
  model:        string,
  systemPrompt: string,
  userMessage:  string,
  maxTokens:    number = 1200,
): Promise<string> {
  const groqKey  = Deno.env.get('GROQ_API_KEY')!;
  const gemKey   = Deno.env.get('GEMINI_API_KEY')!;
  const orKey    = Deno.env.get('OPENROUTER_API_KEY')!;

  if (provider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gemKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig:  { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  if (provider === 'pollinations') {
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(userMessage);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=${model}`;
    return JSON.stringify({ _type: 'image_asset', url: imageUrl, prompt: userMessage });
  }

  if (provider === 'openai') {
    const aiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    // Check if it's an image generation request
    if (model.includes('dall-e')) {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: userMessage,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          response_format: "url"
        }),
      });
      if (!res.ok) throw new Error(`DALL-E ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return JSON.stringify({ _type: 'image_asset', url: data.data[0].url, prompt: userMessage });
    }

    // Check if it's a TTS request
    if (model.includes('tts')) {
        // Since we are moving to 100% free, we will return the text content 
        // and let the frontend use the Web Speech API (speechSynthesis) for zero-cost audio.
        return JSON.stringify({ 
          _type: 'audio_briefing', 
          message: "Free vocal synthesis ready.", 
          text: userMessage,
          use_browser_tts: true 
        });
    }
  }

  if (provider === 'mirofish') {
    // Direct bridge to the MiroFish Python backend
    const response = await fetch('http://localhost:5001/api/agency/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: userMessage }),
    });
    const data = await response.json();
    return JSON.stringify({ 
      _type: 'mirofish_delegation', 
      message: "Task delegated to the Parallel Society.", 
      project_id: data.project_id || 'sim-adaptive-01'
    });
  }

  const url = provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
  const key = provider === 'groq' ? groqKey : orKey;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    'Content-Type':  'application/json',
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ardeno.studio';
    headers['X-Title']      = 'Ardeno OS Orchestrator';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      max_tokens:  maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── JSON parse helper (strips markdown + think blocks) ───────────────────────
// deno-lint-ignore no-explicit-any
function parseJSON(raw: string): any {
  const clean = raw
    .replace(/<think>[\s\S]*?<\/think>/g, '')   // strip DeepSeek thinking
    .replace(/```(?:json)?\n?/g, '')             // strip ``` fences
    .replace(/\n?```/g, '')
    .trim();
  return JSON.parse(clean);
}

// ─── Roster string for CEO ────────────────────────────────────────────────────
const ROSTER = AGENTS
  .filter(a => a.id !== 'orchestrator-prime')
  .map(a => `[${a.id}] ${a.name} (${DEPT_LABELS[a.dept] ?? a.dept} | ${a.role}) — ${a.description}`)
  .join('\n');

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { task = '', context = '' } = await req.json();
    if (!task.trim()) {
      return new Response(JSON.stringify({ error: 'task is required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Phase 1: CEO Planning ─────────────────────────────────────────────────
    const planPrompt = `Task: ${task.trim()}
${context.trim() ? `Context: ${context.trim()}` : ''}

Your available agents:
${ROSTER}

Select 3-7 agents and assign each a precise sub-task.
Return ONLY valid JSON — no markdown, no explanation:
{
  "summary": "2-3 sentence plan",
  "steps": [
    {
      "order": 1,
      "agent_id": "exact-agent-id",
      "agent_name": "Agent Name",
      "task": "Specific, detailed task description for this agent",
      "dept": "dept_key",
      "skills_to_use": []
    }
  ]
}`;

    const ceoRaw = await callLLM(
      'openrouter', 'deepseek/deepseek-r1:free',
      CEO_SYSTEM, planPrompt, 1500,
    );

    // deno-lint-ignore no-explicit-any
    let ceoPlan: { summary: string; steps: any[] };
    try {
      ceoPlan = parseJSON(ceoRaw);
      if (!Array.isArray(ceoPlan.steps) || ceoPlan.steps.length === 0) {
        throw new Error('No steps in CEO plan');
      }
    } catch (parseErr) {
      throw new Error(`CEO planning failed: ${parseErr instanceof Error ? parseErr.message : 'parse error'}`);
    }

    // ── Phase 2: Parallel Execution ───────────────────────────────────────────
    const results = await Promise.all(
      // deno-lint-ignore no-explicit-any
      ceoPlan.steps.map(async (step: any) => {
        const agent = AGENTS.find(a => a.id === step.agent_id);
        if (!agent) {
          return {
            order:       step.order,
            agent_id:    step.agent_id,
            agent_name:  step.agent_name ?? step.agent_id,
            task:        step.task,
            dept:        step.dept ?? '',
            skills_used: step.skills_to_use ?? [],
            result:      `Agent "${step.agent_id}" not found in roster.`,
            error:       true,
          };
        }

        try {
          const output = await callLLM(
            agent.provider, agent.model,
            agent.systemPrompt, step.task, 1200,
          );
          return {
            order:       step.order,
            agent_id:    agent.id,
            agent_name:  agent.name,
            task:        step.task,
            dept:        agent.dept,
            skills_used: step.skills_to_use ?? [],
            result:      output,
            error:       false,
          };
        } catch (err) {
          return {
            order:       step.order,
            agent_id:    agent.id,
            agent_name:  agent.name,
            task:        step.task,
            dept:        agent.dept,
            skills_used: step.skills_to_use ?? [],
            result:      `Error: ${err instanceof Error ? err.message : 'unknown'}`,
            error:       true,
          };
        }
      }),
    );

    // Sort by order
    results.sort((a, b) => a.order - b.order);

    // ── Phase 3: CEO Synthesis ────────────────────────────────────────────────
    const successResults = results.filter(r => !r.error);
    let finalSummary = ceoPlan.summary;

    if (successResults.length > 0) {
      const synopsisInput = successResults
        .map(r => `[${r.agent_name}]:\n${r.result.slice(0, 600)}`)
        .join('\n\n---\n\n');

      try {
        const synthesis = await callLLM(
          'openrouter', 'deepseek/deepseek-r1:free',
          CEO_SYSTEM,
          `Original task: ${task.trim()}\n\nAgent outputs:\n${synopsisInput}\n\nWrite a concise executive summary (3-5 sentences) of what was accomplished and the key recommendations.`,
          500,
        );
        // Strip thinking blocks from synthesis too
        finalSummary = synthesis
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .trim() || ceoPlan.summary;
      } catch {
        // Non-critical — keep original CEO plan summary
      }
    }

    return new Response(
      JSON.stringify({
        plan:    { summary: finalSummary, steps: ceoPlan.steps },
        results,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Orchestration error';
    return new Response(JSON.stringify({ error: msg }), {
      status:  500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
