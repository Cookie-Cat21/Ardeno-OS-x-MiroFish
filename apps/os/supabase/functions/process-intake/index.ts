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
    const submission = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Save intake submission
    const { data: intake, error: intakeErr } = await sb.from("intake_submissions").insert(submission).select().single();
    if (intakeErr) throw intakeErr;

    // 2. Auto-create client
    const { data: client } = await sb.from("clients").insert({
      name: submission.company || submission.name,
      email: submission.email,
      phone: submission.phone || null,
      industry: submission.industry || null,
      country: "Sri Lanka",
    }).select().single();

    // 3. Auto-create project
    let project = null;
    if (client) {
      const { data: proj } = await sb.from("projects").insert({
        client_name: client.name,
        client_id: client.id,
        project_type: submission.project_type || "Website",
        brief: submission.description || "",
        status: "Discovery",
        value: parseBudget(submission.budget_range),
      }).select().single();
      project = proj;
    }

    // 4. Auto-create pipeline deal
    if (client) {
      await sb.from("pipeline_deals").insert({
        client_id: client.id,
        stage: "New Lead",
        value: parseBudget(submission.budget_range),
        next_action: "Review intake and schedule discovery call",
      });
    }

    // 5. Auto-create lead
    await sb.from("leads").insert({
      name: submission.company || submission.name,
      url: submission.website_url || null,
      industry: submission.industry || null,
      status: "Qualified",
      score: 85,
      notes: `Inbound intake form submission. Budget: ${submission.budget_range || "Not specified"}`,
    });

    // 6. Auto-create onboarding tasks
    if (project) {
      const tasks = [
        "Review client intake submission",
        "Schedule discovery call",
        "Prepare project proposal",
        "Send welcome packet",
        "Set up project workspace",
      ];
      for (const title of tasks) {
        await sb.from("tasks").insert({
          title,
          project_id: project.id,
          status: "To Do",
          priority: "High",
        });
      }
    }

    // 7. Create notification
    await sb.from("notification_log").insert({
      type: "intake",
      title: "New Client Intake",
      message: `${submission.name} (${submission.company || "No company"}) submitted an intake form. Budget: ${submission.budget_range || "N/A"}`,
      link: "/intake",
    });

    // 8. Mark as processed
    await sb.from("intake_submissions").update({ processed: true }).eq("id", intake.id);

    return new Response(JSON.stringify({ success: true, client_id: client?.id, project_id: project?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intake error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseBudget(range?: string): number | null {
  if (!range) return null;
  const nums = range.match(/\d+/g);
  if (!nums) return null;
  return Math.round(nums.map(Number).reduce((a, b) => a + b, 0) / nums.length);
}
