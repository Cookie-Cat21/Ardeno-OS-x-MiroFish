import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUDIT_SYSTEM_PROMPT = `You are an expert website auditor for a premium web design agency. Given a URL, produce a thorough audit covering Design Quality, SEO, Copywriting, Performance, and UX/Accessibility.

Be specific, actionable, and honest. Reference real patterns you'd expect on the given URL/domain type.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results = [];

    for (const url of urls.slice(0, 5)) {
      const userPrompt = `Audit the website at: ${url}

Return your analysis using the audit_result tool.`;

      const tools = [
        {
          type: "function",
          function: {
            name: "audit_result",
            description: "Return structured website audit results",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "Overall score 0-100" },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      score: { type: "number" },
                      findings: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: ["name", "score", "findings"],
                    additionalProperties: false,
                  },
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                },
                summary: { type: "string", description: "2-3 sentence executive summary" },
              },
              required: ["overall_score", "sections", "recommendations", "summary"],
              additionalProperties: false,
            },
          },
        },
      ];

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: AUDIT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "audit_result" } },
          max_tokens: 4096,
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        if (res.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (res.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error ${res.status}: ${t}`);
      }

      const data = await res.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No audit result returned");

      const audit = JSON.parse(toolCall.function.arguments);
      results.push({ url, ...audit });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("website-audit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
