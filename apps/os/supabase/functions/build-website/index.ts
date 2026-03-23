import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAgent(apiKey: string, systemPrompt: string, userPrompt: string, model = "google/gemini-2.5-flash") {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limited — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted — please top up in Settings.");
    throw new Error(`AI error ${res.status}: ${t}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();

    // ═══════════════════════════════════════════
    // MODE: Edit a single section
    // ═══════════════════════════════════════════
    if (body.mode === "edit-section") {
      const { sectionId, instructions, currentCode, design, clientName, industry } = body;
      if (!sectionId || !instructions || !currentCode) {
        throw new Error("sectionId, instructions, and currentCode are required for edit-section mode");
      }

      console.log(`✏️ Editing section: ${sectionId}`);

      const editPrompt = `You are editing a section of an existing React + Tailwind CSS website for "${clientName || "a business"}" in the ${industry || "general"} industry.

CURRENT FULL REACT JSX CODE:
${currentCode}

SECTION TO EDIT: The section/component with id="${sectionId}" (or the section that corresponds to "${sectionId}" — it might be a nav, hero, footer, or a named section).

EDIT INSTRUCTIONS FROM THE USER:
${instructions}

DESIGN SYSTEM (keep consistent):
${design ? JSON.stringify(design, null, 2) : "Keep the existing styles consistent."}

RULES:
1. Return the COMPLETE updated React JSX code — not just the section
2. Only modify the targeted section based on the instructions
3. Keep all other sections exactly the same
4. Use Tailwind CSS utility classes for ALL styling — no inline styles, no <style> tags, no CSS files
5. Keep the same component structure
6. Keep all useState hooks, event handlers, and interactivity intact
7. Return ONLY the JSX code, no markdown fences or explanations
8. The code must be a single default export function component using React hooks`;

      const updatedCode = await callAgent(
        LOVABLE_API_KEY,
        "You are an expert React + Tailwind CSS developer. You receive a full React component and instructions to edit ONE specific section. Return the complete updated React JSX with only that section modified. Use only Tailwind CSS classes. No markdown, no explanations — just the raw JSX code.",
        editPrompt,
        "google/gemini-2.5-flash"
      );

      const cleanCode = updatedCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```/g, "").trim();

      console.log(`✅ Section "${sectionId}" edited`);

      return new Response(
        JSON.stringify({ success: true, code: cleanCode }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════
    // MODE: Full build (default)
    // ═══════════════════════════════════════════
    const { clientName, industry, description, referenceUrl, pages } = body;
    if (!clientName || !industry) throw new Error("clientName and industry are required");

    const selectedPages = pages || ["Home", "About", "Services", "Contact"];

    // AGENT 1: Research Agent
    console.log("🔍 Research Agent starting...");
    const researchPrompt = `Research the ${industry} industry for a business called "${clientName}".
Description: ${description || "No description provided"}
${referenceUrl ? `Reference website: ${referenceUrl}` : ""}

Provide a concise research brief (max 400 words) covering:
1. Key industry trends and what clients in this space expect
2. Common services/products offered
3. Target audience demographics and pain points
4. Competitor positioning strategies
5. Recommended tone of voice and messaging approach
6. USPs that would differentiate this business

Be specific and actionable. This will be used to generate website content.`;

    const research = await callAgent(
      LOVABLE_API_KEY,
      "You are an expert market researcher and brand strategist for a web design agency. Provide actionable insights that directly inform website content creation.",
      researchPrompt
    );
    console.log("✅ Research complete");

    // AGENTS 2 & 3: Content + Design (parallel)
    console.log("✍️ Content + 🎨 Design Agents starting in parallel...");

    const contentPrompt = `Based on this research, write website copy for "${clientName}" (${industry}).

Research Brief:
${research}

Pages to create: ${selectedPages.join(", ")}

For EACH page, provide:
- Hero headline (max 8 words, punchy and memorable)
- Hero subheadline (1-2 sentences)
- 3-4 content sections with headlines and body copy (2-3 sentences each)
- Call-to-action text for each section

Also provide:
- Company tagline
- 3 key value propositions (icon suggestion + title + description)
- Footer tagline

Format as structured text with clear labels.

ANTI-SLOP RULES (CRITICAL — violating these makes the output worthless):
- BANNED WORDS: "Unlock", "Elevate", "Empower", "Revolutionize", "Seamless", "Cutting-edge", "Next-level", "World-class", "Synergy", "Leverage", "Holistic", "Robust", "Innovative", "Transform", "Journey", "Passionate"
- BANNED PATTERNS: "We don't just X, we Y", "Your trusted partner in...", "Solutions tailored to your needs", "Take your X to the next level", "In today's fast-paced world"
- BANNED CTAs: "Get Started Today", "Learn More", "Contact Us Today", "Discover More", "Start Your Journey"
- Every sentence must contain a SPECIFIC detail about ${clientName} or the ${industry} industry — if it could describe any business, rewrite it
- Headlines should be unexpected and memorable, not corporate-safe
- CTAs should tell the user exactly what happens next ("See our 2024 portfolio" not "Learn More")
- Write like a sharp human copywriter, not a corporate AI. Be direct, specific, and slightly opinionated.`;


    const designPrompt = `Based on this research, create a design system for "${clientName}" (${industry}).

Research Brief:
${research}

Provide a JSON object with this exact structure:
{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "backgroundColor": "#hex (light, near white)",
  "textColor": "#hex (dark)",
  "headingFont": "Google Font name",
  "bodyFont": "Google Font name",
  "style": "modern|minimal|bold|elegant|playful|corporate",
  "borderRadius": "0px|4px|8px|12px|24px",
  "mood": "one word describing the feel",
  "heroStyle": "gradient|image-overlay|split|centered",
  "navStyle": "transparent|solid|minimal"
}

Choose colors that:
- Reflect the ${industry} industry conventions
- Have strong contrast ratios (WCAG AA)
- Feel professional and trustworthy
- The primary color should be bold and memorable

Return ONLY the JSON, no markdown.`;

    const [content, designRaw] = await Promise.all([
      callAgent(
        LOVABLE_API_KEY,
        "You are a sharp, opinionated copywriter who HATES generic AI slop. You write copy that sounds like a real human with taste — specific, punchy, and impossible to confuse with another business. You never use buzzwords. Every line you write could ONLY work for this specific client.",
        contentPrompt
      ),
      callAgent(
        LOVABLE_API_KEY,
        "You are a senior UI/UX designer. Return only valid JSON with design tokens. No explanation, no markdown code fences.",
        designPrompt
      ),
    ]);
    console.log("✅ Content + Design complete");

    let design: any;
    try {
      const cleaned = designRaw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      design = JSON.parse(cleaned);
    } catch {
      design = {
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        accentColor: "#f59e0b",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        headingFont: "Inter",
        bodyFont: "Inter",
        style: "modern",
        borderRadius: "8px",
        mood: "professional",
        heroStyle: "gradient",
        navStyle: "solid",
      };
    }

    // AGENT 4: Code Generation Agent
    console.log("💻 Code Agent starting...");
    const codePrompt = `Generate a complete, production-ready single-page website as a REACT COMPONENT with TAILWIND CSS for "${clientName}".

DESIGN SYSTEM:
${JSON.stringify(design, null, 2)}

CONTENT:
${content}

PAGES/SECTIONS: ${selectedPages.join(", ")}

Requirements:
1. Write a SINGLE React functional component (default export) that renders the entire website
2. Use React hooks: useState for mobile menu toggle, useEffect for scroll animations
3. Use ONLY Tailwind CSS utility classes for ALL styling — NO inline styles, NO <style> tags, NO CSS modules
4. Map the design system colors to Tailwind classes using arbitrary values like bg-[${design.primaryColor}], text-[${design.textColor}], etc.
5. Use Google Fonts via a <link> tag in a useEffect or as a comment at the top
6. Fully responsive using Tailwind breakpoints (sm:, md:, lg:, xl:)
7. Smooth scroll navigation between sections
8. Each "page" is a <section> with an id matching the page name (lowercase, no spaces)
9. Professional sticky navigation bar with id="nav" — include mobile hamburger menu using useState
10. Hero section with ${design.heroStyle} style and id="hero"
11. Modern grid/flex layouts using Tailwind (grid, flex, gap-*, etc.)
12. Scroll-triggered fade-in animations using useEffect + IntersectionObserver, toggling opacity/translate classes
13. Contact section with a styled form (name, email, message, submit button)
14. Professional footer with social link placeholders and id="footer"
15. Use the exact colors from the design system as Tailwind arbitrary values
16. Add hover effects using Tailwind (hover:, transition, duration-*)
17. Meta tags: add a comment at top with recommended <title> and <meta> tags
18. IMPORTANT: Every major section must have an id attribute

TEMPLATE STRUCTURE:
\`\`\`
// Recommended: <title>${clientName}</title>
// Google Fonts: <link href="https://fonts.googleapis.com/css2?family=${design.headingFont}:wght@400;600;700&family=${design.bodyFont}:wght@400;500&display=swap" rel="stylesheet">

export default function Website() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('opacity-100', 'translate-y-0'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-['${design.bodyFont}']" style={{ fontFamily: "'${design.bodyFont}', sans-serif" }}>
      {/* nav, hero, sections, footer */}
    </div>
  );
}
\`\`\`

ANTI-SLOP DESIGN RULES (CRITICAL):
- Do NOT use a purple-to-blue gradient hero. Be creative with the design system colors.
- Do NOT create symmetrical 3-column icon+title+paragraph grids unless the content genuinely warrants it
- Vary section layouts: use asymmetric grids, full-bleed sections, alternating image-text blocks, card layouts with different sizes
- Each section should feel visually distinct — vary padding, background colors, and layout patterns
- Avoid identical spacing for every section. Create visual rhythm with contrast.
- Make the hero section feel bold and unique, not a template
- Use the specific copy provided — do NOT substitute with generic placeholder text

Return ONLY the React component code. No markdown fences, no explanations, no import statements (React is available globally).
The component must work when rendered with React 18 and Tailwind CSS 3.`;

    const code = await callAgent(
      LOVABLE_API_KEY,
      "You are an expert React + Tailwind CSS developer who builds beautiful, UNIQUE websites. You despise cookie-cutter templates and generic AI layouts. Every site you build looks custom-made and hand-crafted. Return only the component code using Tailwind utility classes. No CSS files, no styled-components, no inline style objects — ONLY Tailwind classes. No markdown, no explanations. Use React.useState and React.useEffect (not imports). The code must work perfectly with React 18 and Tailwind CDN.",
      codePrompt,
      "google/gemini-2.5-flash"
    );
    console.log("✅ Code generation complete");

    const cleanCode = code.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```/g, "").trim();

    return new Response(
      JSON.stringify({
        success: true,
        research,
        content,
        design,
        code: cleanCode,
        agents: [
          { name: "Research Agent", status: "complete", model: "gemini-2.5-flash" },
          { name: "Content Agent", status: "complete", model: "gemini-2.5-flash" },
          { name: "Design Agent", status: "complete", model: "gemini-2.5-flash" },
          { name: "Code Agent", status: "complete", model: "gemini-2.5-flash" },
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("build-website error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
