import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAgent(apiKey: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_suggestions",
          description: "Return improvement suggestions for a website",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique suggestion id" },
                    category: { type: "string", enum: ["ux", "seo", "performance"] },
                    severity: { type: "string", enum: ["critical", "important", "nice-to-have"] },
                    title: { type: "string", description: "Short title (max 10 words)" },
                    description: { type: "string", description: "What's wrong and why it matters (1-2 sentences)" },
                    fix_instructions: { type: "string", description: "Exact instructions for an AI code agent to fix this in the React JSX" },
                  },
                  required: ["id", "category", "severity", "title", "description", "fix_instructions"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_suggestions" } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limited — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted — please top up in Settings.");
    throw new Error(`AI error ${res.status}: ${t}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.suggestions || [];
  } catch {
    return [];
  }
}

async function applyFix(apiKey: string, code: string, fixInstructions: string, design: any, clientName: string) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are an expert React + Tailwind CSS developer. You receive a full React component and instructions to apply a specific improvement. Return the complete updated React JSX with the fix applied. Use only Tailwind CSS classes. No markdown, no explanations — just the raw JSX code.",
        },
        {
          role: "user",
          content: `CURRENT FULL REACT JSX CODE:\n${code}\n\nDESIGN SYSTEM:\n${JSON.stringify(design || {})}\n\nCLIENT: ${clientName}\n\nIMPROVEMENT TO APPLY:\n${fixInstructions}\n\nRULES:\n1. Return the COMPLETE updated React JSX code\n2. Only modify what's needed for this specific improvement\n3. Keep all other code exactly the same\n4. Use Tailwind CSS utility classes only\n5. Return ONLY the JSX code, no markdown fences or explanations`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  return content.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```/g, "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();

    // MODE: Apply a single fix
    if (body.mode === "apply-fix") {
      const { code, fixInstructions, design, clientName } = body;
      if (!code || !fixInstructions) throw new Error("code and fixInstructions are required");

      console.log("🔧 Applying fix...");
      const updatedCode = await applyFix(LOVABLE_API_KEY, code, fixInstructions, design, clientName || "");
      console.log("✅ Fix applied");

      return new Response(
        JSON.stringify({ success: true, code: updatedCode }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MODE: Analyze (default) — run 3 review agents in parallel
    const { code, design, clientName, industry } = body;
    if (!code) throw new Error("code is required");

    const codeSnippet = code.length > 15000 ? code.slice(0, 15000) + "\n// ... (truncated)" : code;

    console.log("🔍 Running 4 review agents in parallel...");

    const baseContext = `Website for "${clientName || "a business"}" in the ${industry || "general"} industry.\n\nREACT JSX CODE:\n${codeSnippet}\n\nDESIGN SYSTEM:\n${JSON.stringify(design || {}, null, 2)}`;

    const [uxSuggestions, seoSuggestions, perfSuggestions, authenticitySuggestions] = await Promise.all([
      callAgent(
        LOVABLE_API_KEY,
        `You are an expert UX/UI reviewer. Analyze the React website code and identify UX/design issues. Focus on:
- Visual hierarchy and typography
- Color contrast and readability
- Layout and spacing consistency
- Mobile responsiveness issues
- Interactive element feedback (hover states, transitions)
- CTA visibility and placement
- Navigation usability
Return 2-4 specific, actionable suggestions. Each suggestion's fix_instructions must be precise enough for another AI to implement.`,
        baseContext
      ),
      callAgent(
        LOVABLE_API_KEY,
        `You are an expert SEO analyst. Analyze the React website code and identify SEO issues. Focus on:
- Missing or poor meta tags (title, description)
- Heading hierarchy (H1, H2, H3 structure)
- Image alt text
- Semantic HTML usage
- Schema markup opportunities
- Link structure and anchor text
- Content optimization
Return 2-4 specific, actionable suggestions. Each suggestion's fix_instructions must be precise enough for another AI to implement.`,
        baseContext
      ),
      callAgent(
        LOVABLE_API_KEY,
        `You are an expert web performance engineer. Analyze the React website code and identify performance issues. Focus on:
- Unnecessary re-renders or heavy computations
- Image optimization opportunities
- CSS efficiency (redundant classes, unused styles)
- Animation performance (GPU-accelerated transforms vs layout-triggering)
- Lazy loading opportunities
- Bundle size concerns
- Accessibility (ARIA labels, keyboard navigation, focus management)
Return 2-4 specific, actionable suggestions. Each suggestion's fix_instructions must be precise enough for another AI to implement.`,
        baseContext
      ),
      callAgent(
        LOVABLE_API_KEY,
        `You are a ruthless authenticity and quality editor. Your job is to detect and eliminate generic, AI-sounding, cliché copy and design patterns. You HATE:

COPY RED FLAGS:
- "Unlock", "Elevate", "Empower", "Revolutionize", "Seamless", "Cutting-edge", "Next-level", "World-class"
- "We don't just X, we Y" formula
- "Your trusted partner in...", "Solutions tailored to your needs"
- Vague value props that could apply to any business ("We deliver results")
- Buzzword-stuffed headlines with zero specificity
- "Lorem ipsum"-level generic CTAs like "Get Started Today" or "Learn More"

DESIGN RED FLAGS:
- Purple/blue gradient hero sections (the AI default)
- Generic stock-photo-style placeholder descriptions
- Overly symmetrical 3-column benefit grids with icon + title + paragraph
- Cookie-cutter testimonial carousels
- Identical spacing and layout for every section (no visual rhythm)

For each issue found, provide specific replacement copy or design instructions that feel HUMAN, SPECIFIC to the "${industry || "general"}" industry, and memorable. Reference the actual business "${clientName}" — make suggestions that only work for THIS business, not any business.

Return 2-4 suggestions. Mark generic/cliché issues as "critical" severity. Each fix_instructions must tell the code agent exactly what to replace and with what.`,
        baseContext
      ),
    ]);

    console.log(`✅ Reviews complete: ${uxSuggestions.length} UX, ${seoSuggestions.length} SEO, ${perfSuggestions.length} Perf, ${authenticitySuggestions.length} Authenticity`);

    // Prefix IDs to avoid collisions
    const allSuggestions = [
      ...authenticitySuggestions.map((s: any, i: number) => ({ ...s, id: `auth-${i}`, category: "authenticity" })),
      ...uxSuggestions.map((s: any, i: number) => ({ ...s, id: `ux-${i}`, category: "ux" })),
      ...seoSuggestions.map((s: any, i: number) => ({ ...s, id: `seo-${i}`, category: "seo" })),
      ...perfSuggestions.map((s: any, i: number) => ({ ...s, id: `perf-${i}`, category: "performance" })),
    ];

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: allSuggestions,
        agents: [
          { name: "Authenticity Guard", count: authenticitySuggestions.length },
          { name: "UX Reviewer", count: uxSuggestions.length },
          { name: "SEO Optimizer", count: seoSuggestions.length },
          { name: "Performance Auditor", count: perfSuggestions.length },
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("improve-website error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
