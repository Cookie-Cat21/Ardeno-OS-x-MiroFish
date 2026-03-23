import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENTS: Record<string, { name: string; systemPrompt: string; skills: string[] }> = {
  copywriter: { name: "Copywriter", systemPrompt: "You are an expert web copywriter for a premium web design agency. Write compelling, conversion-focused copy that is clean, modern, and professional. Match the client's brand voice.", skills: ["generate_copy", "content_calendar", "draft_email"] },
  "proposal-writer": { name: "Proposal Writer", systemPrompt: "You are a business proposal specialist for Ardeno Studio, a high-end web design agency in Sri Lanka. Write professional, persuasive proposals that clearly communicate value and justify premium pricing.", skills: ["create_proposal", "query_data", "generate_report"] },
  "social-media-writer": { name: "Social Media Writer", systemPrompt: "You write engaging social media content for web design agencies and their clients. Keep copy concise, on-brand, and optimised for engagement.", skills: ["generate_copy", "content_calendar"] },
  "email-outreach": { name: "Email Outreach", systemPrompt: "You are an expert at writing professional business emails for a web design agency. Write clear, concise, and persuasive emails that get responses. Never be pushy.", skills: ["draft_email", "log_outreach", "query_data"] },
  "lead-qualifier": { name: "Lead Qualifier", systemPrompt: "You qualify leads for a premium web design agency. Analyse the lead's message, score them 1-10 on fit and budget potential, identify their core need, and suggest next steps.", skills: ["score_lead", "create_lead", "update_deal", "query_data"] },
  "client-support": { name: "Client Support", systemPrompt: "You are a professional client success manager for Ardeno Studio. Respond to client queries warmly, clearly, and helpfully. Always maintain a premium, friendly tone.", skills: ["query_data", "create_task", "draft_email"] },
  "content-strategist": { name: "Content Strategist", systemPrompt: "You are a content strategy expert for digital agencies. Create detailed content plans, campaign ideas, and brand messaging frameworks tailored to the client's industry.", skills: ["content_calendar", "generate_copy", "competitor_research"] },
  "quick-researcher": { name: "Quick Researcher", systemPrompt: "You are a fast research assistant. Given any topic, provide a concise, well-structured summary with the most important facts, insights, and actionable takeaways.", skills: ["query_data", "competitor_research", "analyze_website"] },
  "deep-researcher": { name: "Deep Researcher", systemPrompt: "You are a professional research analyst. Produce thorough, well-structured research reports with citations, key insights, and strategic implications.", skills: ["query_data", "competitor_research", "analyze_website", "generate_report"] },
  "seo-analyst": { name: "SEO Analyst", systemPrompt: "You are an SEO specialist for web design agencies. Provide actionable SEO recommendations, keyword strategies, and optimised meta content for client websites.", skills: ["analyze_website", "generate_copy", "generate_report"] },
  "code-agent": { name: "Code Agent", systemPrompt: "You are a senior web developer. Write clean, modern, well-commented code. Specialise in HTML/CSS/JS, React, WordPress, and Webflow. Always explain what the code does.", skills: ["query_data", "analyze_website"] },
  "ui-ux-advisor": { name: "UI/UX Advisor", systemPrompt: "You are a UI/UX expert for premium web design. Review designs and provide specific, actionable feedback on layout, typography, colour, UX copy, and accessibility.", skills: ["analyze_website", "generate_report"] },
  "competitor-analyst": { name: "Competitor Analyst", systemPrompt: "You analyse competitors for web design agency clients. Break down their website, messaging, pricing, strengths and weaknesses, and identify positioning opportunities.", skills: ["competitor_research", "analyze_website", "query_data", "generate_report"] },
  "strategy-advisor": { name: "Strategy Advisor", systemPrompt: "You are a business strategy consultant specialising in creative agencies and their clients. Provide clear, actionable strategic advice grounded in real market realities.", skills: ["query_data", "generate_report", "competitor_research", "score_lead"] },
  "document-analyst": { name: "Document Analyst", systemPrompt: "You analyse documents for a web design agency. Extract key requirements, flag important clauses, summarise scope, and identify risks or opportunities.", skills: ["query_data", "create_task", "generate_report"] },
  "jci-tender-analyst": { name: "JCI & Tender Analyst", systemPrompt: "You specialise in analysing tenders, grants, and competition briefs. Extract eligibility criteria, scoring rubrics, key deadlines, and provide a step-by-step response strategy.", skills: ["query_data", "create_task", "generate_report", "create_proposal"] },
  "brand-analyst": { name: "Brand Analyst", systemPrompt: "You are a brand strategist. Audit brands for consistency, clarity, and market fit. Provide specific recommendations on visual identity, brand voice, and positioning.", skills: ["analyze_website", "competitor_research", "generate_report"] },
  "performance-reporter": { name: "Performance Reporter", systemPrompt: "You generate professional performance reports for web design agency clients. Summarise project progress, key metrics, wins, and next steps in a clear, client-friendly format.", skills: ["query_data", "generate_report", "draft_email"] },
  "orchestrator-prime": { name: "Orchestrator Prime", systemPrompt: "You are the master AI coordinator for Ardeno Studio. Break down tasks, identify which specialist agent should handle each part, and synthesise final outputs. Be decisive and efficient.", skills: ["query_data"] },
  "orchestrator-backup": { name: "Orchestrator Backup", systemPrompt: "You are the master AI coordinator for Ardeno Studio. Break down tasks, identify which specialist agent should handle each part, and synthesise final outputs. Be decisive and efficient.", skills: ["query_data"] },
};

// OpenRouter free model mapping
const OPENROUTER_MODELS: Record<string, string> = {
  "deepseek-r1": "deepseek/deepseek-r1:free",
  "qwen3": "qwen/qwen3-32b:free",
  "llama4": "meta-llama/llama-4-maverick:free",
  "gemini-flash-free": "google/gemini-2.5-flash:free",
  "mistral": "mistralai/mistral-small-3.1-24b-instruct:free",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, messages, conversation_id, provider: requestedProvider, model: requestedModel } = await req.json();
    if (!agent_id || !messages) {
      return new Response(JSON.stringify({ error: "agent_id and messages are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agent = AGENTS[agent_id];
    if (!agent) {
      return new Response(JSON.stringify({ error: `Unknown agent: ${agent_id}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Filter out disabled skills
    const { data: disabledOverrides } = await supabaseClient
      .from("skill_overrides")
      .select("skill_id")
      .eq("enabled", false);
    const disabledSet = new Set((disabledOverrides ?? []).map((o: any) => o.skill_id.replace(/-/g, "_")));
    const activeSkills = agent.skills.filter(s => !disabledSet.has(s));

    // Build system prompt
    const systemPrompt = activeSkills.length > 0
      ? `${agent.systemPrompt}\n\nYou have these skills available: ${activeSkills.join(", ")}. Use them when relevant.`
      : agent.systemPrompt;

    // Determine provider: explicit request > fallback to lovable
    const useOpenRouter = requestedProvider === "openrouter";
    const startTime = Date.now();
    let response: Response;
    let providerUsed: string;
    let modelUsed: string;

    if (useOpenRouter) {
      const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
      if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

      // Resolve model shorthand or use full ID
      modelUsed = OPENROUTER_MODELS[requestedModel] || requestedModel || "deepseek/deepseek-r1:free";
      providerUsed = "openrouter";

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ardeno.studio",
          "X-Title": "Ardeno OS",
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
      });
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      modelUsed = "google/gemini-2.5-flash";
      providerUsed = "lovable";

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error(`${providerUsed} error:`, response.status, t);
      throw new Error(`${providerUsed} error: ${response.status}`);
    }

    // Log usage
    const inputChars = messages.reduce((s: number, m: any) => s + (m.content?.length || 0), 0);
    const inputTokens = Math.floor(inputChars / 4);

    supabaseClient.from("agent_usage").insert({
      agent_id,
      agent_name: agent.name,
      provider: providerUsed,
      model: modelUsed,
      input_tokens: inputTokens,
      output_tokens: 0,
      total_tokens: inputTokens,
      estimated_cost: useOpenRouter ? 0 : inputTokens * 0.0000001,
      response_time_ms: Date.now() - startTime,
    }).then(() => {}).catch(console.error);

    // Save conversation
    if (conversation_id) {
      supabaseClient.from("agent_conversations").upsert({
        id: conversation_id,
        agent_id,
        messages: [...messages],
      }).then(() => {}).catch(console.error);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
