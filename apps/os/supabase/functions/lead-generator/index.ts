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
    const { action, criteria } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "generate") {
      // AI-powered lead generation based on criteria
      const prompt = `Generate 10 realistic business leads for the following criteria:
Industry: ${criteria.industry}
Location: ${criteria.location}
Company Size: ${criteria.companySize}
Budget Range: ${criteria.budgetRange}

For each lead, provide:
- Company name (realistic)
- Website URL (realistic domain)
- Industry category
- Estimated company size
- Location (city, country)
- Lead score (1-10 based on fit)
- Brief notes about why they're a good prospect

Format as JSON array with fields: name, url, industry, city, country, score, notes`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices[0].message.content;
      
      // Extract JSON from the response
      let leads;
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        leads = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        // If parsing fails, create sample leads
        leads = [
          {
            name: `${criteria.industry} Solutions Inc`,
            url: `${criteria.industry.toLowerCase().replace(/\s+/g, '')}-solutions.com`,
            industry: criteria.industry,
            city: criteria.location.split(',')[0],
            country: criteria.location.split(',')[1]?.trim() || "US",
            score: Math.floor(Math.random() * 4) + 7,
            notes: `Growing ${criteria.industry.toLowerCase()} company, perfect fit for our services`
          }
        ];
      }

      // Insert leads into database
      const leadsToInsert = leads.map((lead: any) => ({
        name: lead.name,
        url: lead.url,
        industry: lead.industry,
        city: lead.city,
        country: lead.country,
        score: lead.score,
        notes: lead.notes,
        status: "New"
      }));

      const { data: insertedLeads, error } = await sb
        .from("leads")
        .insert(leadsToInsert)
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        leads: insertedLeads,
        count: insertedLeads.length 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "score") {
      // AI-powered lead scoring
      const { leadId, leadData } = criteria;
      
      const scorePrompt = `Score this lead from 1-10 based on business potential:
Company: ${leadData.name}
Industry: ${leadData.industry}
Location: ${leadData.city}, ${leadData.country}
Website: ${leadData.url}
Current Notes: ${leadData.notes}

Provide a score (1-10) and brief explanation of the scoring rationale.
Format as JSON: {"score": number, "reasoning": "string"}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: scorePrompt }],
          temperature: 0.3
        })
      });

      const aiData = await aiResponse.json();
      const content = aiData.choices[0].message.content;
      
      let result;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 5, reasoning: "Auto-generated score" };
      } catch {
        result = { score: 5, reasoning: "Auto-generated score" };
      }

      // Update lead score in database
      const { error } = await sb
        .from("leads")
        .update({ 
          score: result.score,
          notes: `${leadData.notes}\n\nAI Scoring: ${result.reasoning}`.trim()
        })
        .eq("id", leadId);

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        score: result.score,
        reasoning: result.reasoning
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Lead generation error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});