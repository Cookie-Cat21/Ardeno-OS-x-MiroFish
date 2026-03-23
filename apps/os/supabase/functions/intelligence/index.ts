import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Gather all agency data
    const [leads, proposals, outreach, projects, deals, audits] = await Promise.all([
      sb.from("leads").select("*").limit(500),
      sb.from("proposals").select("*").limit(500),
      sb.from("outreach_logs").select("*").limit(500),
      sb.from("projects").select("*").limit(500),
      sb.from("pipeline_deals").select("*").limit(500),
      sb.from("website_audits").select("url, overall_score, created_at").limit(200),
    ]);

    const dataSummary = {
      total_leads: leads.data?.length || 0,
      total_proposals: proposals.data?.length || 0,
      total_outreach: outreach.data?.length || 0,
      total_projects: projects.data?.length || 0,
      total_deals: deals.data?.length || 0,
      leads_by_status: groupBy(leads.data || [], "status"),
      leads_by_industry: groupBy(leads.data || [], "industry"),
      proposals_by_result: groupBy(proposals.data || [], "result"),
      outreach_reply_rate: calcRate(outreach.data || [], "replied"),
      outreach_meeting_rate: calcRate(outreach.data || [], "meeting_booked"),
      outreach_conversion_rate: calcRate(outreach.data || [], "converted"),
      projects_by_status: groupBy(projects.data || [], "status"),
      deals_by_stage: groupBy(deals.data || [], "stage"),
      avg_deal_value: avgField(deals.data || [], "value"),
      avg_proposal_value: avgField(proposals.data || [], "value"),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are the intelligence engine for Ardeno OS, a web design agency management system. Analyze the agency data and produce actionable insights.

Be specific with numbers. Reference actual data patterns. Focus on:
1. Which industries convert best
2. Outreach performance patterns
3. Proposal win rates and pricing insights
4. Pipeline health
5. Revenue opportunities
6. Specific recommended actions

Return your analysis using the intelligence_report tool.`;

    const userPrompt = `Here is the current agency data summary:

${JSON.stringify(dataSummary, null, 2)}

Raw leads sample (last 20):
${JSON.stringify((leads.data || []).slice(0, 20), null, 2)}

Proposals sample (last 20):
${JSON.stringify((proposals.data || []).slice(0, 20), null, 2)}

Outreach sample (last 20):
${JSON.stringify((outreach.data || []).slice(0, 20), null, 2)}

Analyze this data and provide actionable intelligence.`;

    const tools = [{
      type: "function",
      function: {
        name: "intelligence_report",
        description: "Return structured agency intelligence report",
        parameters: {
          type: "object",
          properties: {
            opportunity_score: { type: "number", description: "Overall agency health/opportunity score 0-100" },
            top_industries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  industry: { type: "string" },
                  conversion_rate: { type: "number" },
                  avg_value: { type: "number" },
                  potential: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["industry", "conversion_rate", "avg_value", "potential"],
                additionalProperties: false,
              },
            },
            outreach_insights: {
              type: "object",
              properties: {
                best_method: { type: "string" },
                best_subject_pattern: { type: "string" },
                reply_rate: { type: "number" },
                meeting_rate: { type: "number" },
                recommendation: { type: "string" },
              },
              required: ["best_method", "best_subject_pattern", "reply_rate", "meeting_rate", "recommendation"],
              additionalProperties: false,
            },
            pricing_insights: {
              type: "object",
              properties: {
                avg_proposal_value: { type: "number" },
                win_rate: { type: "number" },
                sweet_spot_min: { type: "number" },
                sweet_spot_max: { type: "number" },
                recommendation: { type: "string" },
              },
              required: ["avg_proposal_value", "win_rate", "sweet_spot_min", "sweet_spot_max", "recommendation"],
              additionalProperties: false,
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  category: { type: "string" },
                  action: { type: "string" },
                  expected_impact: { type: "string" },
                },
                required: ["priority", "category", "action", "expected_impact"],
                additionalProperties: false,
              },
            },
            executive_summary: { type: "string" },
          },
          required: ["opportunity_score", "top_industries", "outreach_insights", "pricing_insights", "recommendations", "executive_summary"],
          additionalProperties: false,
        },
      },
    }];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "intelligence_report" } },
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${res.status}: ${t}`);
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No intelligence report returned");

    const report = JSON.parse(toolCall.function.arguments);

    // Save snapshot
    await sb.from("intelligence_snapshots").insert({
      snapshot_type: "full",
      insights: report,
      recommendations: report.recommendations,
      data_summary: dataSummary,
    });

    return new Response(JSON.stringify({ report, data_summary: dataSummary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intelligence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function groupBy(arr: any[], key: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const val = item[key] || "Unknown";
    result[val] = (result[val] || 0) + 1;
  }
  return result;
}

function calcRate(arr: any[], field: string): number {
  if (arr.length === 0) return 0;
  const positive = arr.filter((a) => a[field] === true).length;
  return Math.round((positive / arr.length) * 100);
}

function avgField(arr: any[], field: string): number {
  const vals = arr.filter((a) => a[field] != null).map((a) => Number(a[field]));
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}
