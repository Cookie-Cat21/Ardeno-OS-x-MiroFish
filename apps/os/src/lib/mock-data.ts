import { MockEmail, Project, Task, Lead, PipelineDeal, Prompt } from "./types";

export const MOCK_EMAILS: MockEmail[] = [
  {
    id: "1", from: "Sarah Chen", fromEmail: "sarah@techstartup.io",
    subject: "Website Redesign Inquiry",
    preview: "Hi Ardeno team, we're looking to completely redesign our SaaS platform website...",
    body: "Hi Ardeno team,\n\nWe're looking to completely redesign our SaaS platform website. Our current site is outdated and doesn't convert well. We need a modern, professional design that can help us scale.\n\nBudget is around $5,000-$8,000. Timeline would be 6-8 weeks.\n\nCould we set up a call this week?\n\nBest,\nSarah Chen\nCTO, TechStartup.io",
    date: "2026-03-08T09:30:00Z", read: false,
  },
  {
    id: "2", from: "Marcus Johnson", fromEmail: "marcus@greenleaf.lk",
    subject: "Re: Logo and Brand Identity Package",
    preview: "Thanks for the proposal! We'd like to move forward with Option B...",
    body: "Thanks for the proposal! We'd like to move forward with Option B — the premium brand identity package.\n\nCan you send over the contract so we can get started?\n\nCheers,\nMarcus",
    date: "2026-03-08T08:15:00Z", read: false,
  },
  {
    id: "3", from: "Priya Mendis", fromEmail: "priya@colomboretail.com",
    subject: "E-commerce Site Quote Request",
    preview: "We need an e-commerce website for our retail chain. About 500 products...",
    body: "Hi there,\n\nWe need an e-commerce website for our retail chain. We have about 500 products and need payment integration with local payment gateways.\n\nCan you provide a quote?\n\nRegards,\nPriya Mendis\nColombo Retail Group",
    date: "2026-03-07T16:45:00Z", read: true,
  },
  {
    id: "4", from: "David Williams", fromEmail: "david@ngo-foundation.org",
    subject: "Tender Response: NGO Website RFP",
    preview: "Please find attached the RFP for our organization's website rebuild...",
    body: "Dear Ardeno Studio,\n\nPlease find attached the RFP for our organization's website rebuild. The submission deadline is March 20th.\n\nKey requirements:\n- Multilingual support (Sinhala, Tamil, English)\n- Donation integration\n- Event management system\n- Mobile-first design\n\nBudget range: $10,000-$15,000\n\nBest regards,\nDavid Williams\nNGO Foundation",
    date: "2026-03-07T11:00:00Z", read: true,
  },
  {
    id: "5", from: "Newsletter", fromEmail: "digest@designweekly.com",
    subject: "Design Weekly: Top Trends for 2026",
    preview: "This week's roundup of the hottest design trends and tools...",
    body: "This week's roundup of the hottest design trends and tools for 2026.\n\n1. AI-assisted design workflows\n2. Variable fonts and dynamic typography\n3. Micro-interactions and motion design\n4. Sustainable web design practices\n\nRead more at designweekly.com",
    date: "2026-03-07T06:00:00Z", read: true,
  },
];

export const MOCK_PROJECTS: Project[] = [
  { id: "p1", client_name: "TechStartup.io", project_type: "Website Redesign", brief: "Complete redesign of SaaS platform website with modern UI, improved conversion funnels, and responsive design.", status: "Design", deadline: "2026-04-15", value: 7500, created_at: "2026-02-01T00:00:00Z" },
  { id: "p2", client_name: "GreenLeaf Lanka", project_type: "Brand Identity", brief: "Full brand identity package including logo, color palette, typography, and brand guidelines for an eco-friendly products company.", status: "Discovery", deadline: "2026-03-30", value: 3000, created_at: "2026-02-15T00:00:00Z" },
  { id: "p3", client_name: "Colombo Retail Group", project_type: "E-commerce Website", brief: "E-commerce platform with 500+ products, local payment gateway integration, inventory management, and customer portal.", status: "Development", deadline: "2026-05-01", value: 12000, created_at: "2026-01-20T00:00:00Z" },
  { id: "p4", client_name: "Island Resorts", project_type: "Landing Page", brief: "High-converting landing page for luxury resort bookings with stunning visuals and booking integration.", status: "Review", deadline: "2026-03-10", value: 2500, created_at: "2026-01-10T00:00:00Z" },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Finalise TechStartup homepage mockup", description: "Complete the high-fidelity mockup for the homepage with all sections", assigned_to: "Ovindu", project_id: "p1", status: "In Progress", priority: "High", due_date: "2026-03-10", created_at: "2026-03-01T00:00:00Z" },
  { id: "t2", title: "GreenLeaf logo concepts", description: "Create 3 logo concept options for client review", assigned_to: "Suven", project_id: "p2", status: "To Do", priority: "Medium", due_date: "2026-03-12", created_at: "2026-03-02T00:00:00Z" },
  { id: "t3", title: "Set up payment gateway", description: "Integrate local payment gateways for Colombo Retail e-commerce site", assigned_to: "Ovindu", project_id: "p3", status: "To Do", priority: "High", due_date: "2026-03-20", created_at: "2026-03-03T00:00:00Z" },
  { id: "t4", title: "Island Resorts final review", description: "Final QA and review of landing page before handoff", assigned_to: "Suven", project_id: "p4", status: "In Progress", priority: "High", due_date: "2026-03-09", created_at: "2026-03-04T00:00:00Z" },
  { id: "t5", title: "Send proposal to NGO Foundation", description: "Draft and send the website rebuild proposal based on their RFP", assigned_to: "Ovindu", project_id: null, status: "To Do", priority: "Medium", due_date: "2026-03-15", created_at: "2026-03-05T00:00:00Z" },
];

export const MOCK_LEADS: Lead[] = [
  { id: "l1", name: "Kandy Tea Exports", url: "https://kandytea.lk", industry: "Agriculture", city: "Kandy", country: "Sri Lanka", score: 8, status: "Qualified", notes: "Needs modern website for export business. High budget potential.", created_at: "2026-03-01T00:00:00Z" },
  { id: "l2", name: "Wave Surf School", url: "https://wavesurfschool.com", industry: "Tourism", city: "Arugam Bay", country: "Sri Lanka", score: 6, status: "Contacted", notes: "Wants booking system. Small budget.", created_at: "2026-03-03T00:00:00Z" },
  { id: "l3", name: "MedTech Solutions", url: "https://medtech.io", industry: "Healthcare", city: "Singapore", country: "Singapore", score: 9, status: "New", notes: "Enterprise SaaS company. Needs complete rebrand.", created_at: "2026-03-06T00:00:00Z" },
  { id: "l4", name: "Colombo Coffee Co", url: "https://colombocoffee.lk", industry: "F&B", city: "Colombo", country: "Sri Lanka", score: 5, status: "Responded", notes: "Wants e-commerce for coffee beans.", created_at: "2026-03-04T00:00:00Z" },
  { id: "l5", name: "FinanceHub", url: "https://financehub.com", industry: "Fintech", city: "London", country: "UK", score: 7, status: "New", notes: "Startup. Needs landing page + dashboard.", created_at: "2026-03-07T00:00:00Z" },
];

export const MOCK_DEALS: PipelineDeal[] = [
  { id: "d1", lead_id: "l1", client_id: null, stage: "Proposal Sent", value: 8000, last_contact: "2026-03-07", next_action: "Follow up on proposal", notes: "Sent detailed proposal with 3 packages", client_name: "Kandy Tea Exports", created_at: "2026-03-02T00:00:00Z" },
  { id: "d2", lead_id: "l3", client_id: null, stage: "New Lead", value: 25000, last_contact: "2026-03-06", next_action: "Schedule discovery call", notes: "High-value enterprise lead", client_name: "MedTech Solutions", created_at: "2026-03-06T00:00:00Z" },
  { id: "d3", lead_id: "l2", client_id: null, stage: "Contacted", value: 2000, last_contact: "2026-03-05", next_action: "Send portfolio examples", notes: null, client_name: "Wave Surf School", created_at: "2026-03-04T00:00:00Z" },
  { id: "d4", lead_id: null, client_id: null, stage: "Negotiating", value: 15000, last_contact: "2026-03-08", next_action: "Revise pricing", notes: "Client wants phased delivery", client_name: "Island Hotels Group", created_at: "2026-02-20T00:00:00Z" },
  { id: "d5", lead_id: null, client_id: null, stage: "Closed Won", value: 7500, last_contact: "2026-03-01", next_action: null, notes: "Project started", client_name: "TechStartup.io", created_at: "2026-02-01T00:00:00Z" },
];

export const MOCK_PROMPTS: Prompt[] = [
  { id: "pr1", title: "Cold Email - Website Audit Hook", content: "Hi {{name}},\n\nI took a look at {{url}} and noticed a few things that could be improved to help you get more {{goal}}.\n\nWould you be open to a quick chat this week?", category: "Emails", variables: ["name", "url", "goal"], agent_id: "email-outreach", use_count: 12, created_at: "2026-02-15T00:00:00Z" },
  { id: "pr2", title: "Project Proposal Intro", content: "Dear {{client_name}},\n\nThank you for considering Ardeno Studio for your {{project_type}} project. Based on our discovery call, here's our recommended approach:", category: "Proposals", variables: ["client_name", "project_type"], agent_id: "proposal-writer", use_count: 8, created_at: "2026-02-20T00:00:00Z" },
  { id: "pr3", title: "SEO Meta Description", content: "Write an SEO-optimised meta description for a {{industry}} company called {{name}}. Their main service is {{service}}. Keep under 160 characters.", category: "SEO", variables: ["industry", "name", "service"], agent_id: "seo-analyst", use_count: 15, created_at: "2026-01-10T00:00:00Z" },
  { id: "pr4", title: "Weekly Report Template", content: "Generate a weekly progress report for {{client_name}}'s {{project_type}} project. Include: completed tasks, upcoming milestones, blockers, and next steps.", category: "Reports", variables: ["client_name", "project_type"], agent_id: "performance-reporter", use_count: 6, created_at: "2026-02-01T00:00:00Z" },
];

export const RECENT_ACTIVITY = [
  { id: "a1", agent: "Proposal Writer", action: "Generated proposal for TechStartup.io", time: "2 hours ago" },
  { id: "a2", agent: "Quick Researcher", action: "Researched competitor pricing for GreenLeaf", time: "3 hours ago" },
  { id: "a3", agent: "Email Outreach", action: "Drafted follow-up email for Island Resorts", time: "5 hours ago" },
  { id: "a4", agent: "SEO Analyst", action: "Completed SEO audit for Colombo Retail", time: "6 hours ago" },
  { id: "a5", agent: "Lead Qualifier", action: "Scored lead: Sarah Chen (8/10)", time: "8 hours ago" },
  { id: "a6", agent: "Copywriter", action: "Wrote homepage copy for TechStartup.io", time: "Yesterday" },
  { id: "a7", agent: "Deep Researcher", action: "Market analysis for eco-friendly products sector", time: "Yesterday" },
  { id: "a8", agent: "Brand Analyst", action: "Brand audit for GreenLeaf Lanka", time: "2 days ago" },
];
