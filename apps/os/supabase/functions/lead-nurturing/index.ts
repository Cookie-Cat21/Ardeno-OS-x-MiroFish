import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DbClient = ReturnType<typeof createClient>;

type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  score: number | null;
};

type SequenceRow = {
  id: string;
  trigger_type: string;
  trigger_conditions: any;
  active: boolean;
};

type StatusRow = {
  id: string;
  lead_id: string;
  sequence_id: string;
  current_step: number;
  next_action_at: string | null;
  paused: boolean;
  completed: boolean;
  leads?: LeadRow;
  nurturing_sequences?: SequenceRow;
};

type StepRow = {
  id: string;
  sequence_id: string;
  step_order: number;
  step_name: string;
  delay_hours: number;
  action_type: string;
  action_data: any;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sb = getServiceClient();

    let actionsProcessed = 0;
    let leadsEnrolled = 0;

    // 1) Process due actions
    const nowIso = new Date().toISOString();
    const { data: dueStatuses, error: dueErr } = await sb
      .from("lead_nurturing_status")
      .select("*, leads (*), nurturing_sequences (*)")
      .eq("completed", false)
      .eq("paused", false)
      .not("next_action_at", "is", null)
      .lte("next_action_at", nowIso);

    if (dueErr) throw dueErr;

    for (const status of (dueStatuses as unknown as StatusRow[]) || []) {
      const lead = status.leads;
      if (!lead) continue;

      try {
        const step = await getCurrentStep(sb, status);
        if (!step) {
          console.warn(`No step found for status ${status.id} (sequence=${status.sequence_id}, step=${status.current_step})`);
          continue;
        }

        await executeAction(sb, step, lead, status);

        const { data: nextStep } = await sb
          .from("nurturing_steps")
          .select("*")
          .eq("sequence_id", status.sequence_id)
          .eq("step_order", status.current_step + 1)
          .maybeSingle();

        if (nextStep) {
          const nextActionTime = new Date();
          nextActionTime.setHours(nextActionTime.getHours() + (nextStep as StepRow).delay_hours);

          await sb
            .from("lead_nurturing_status")
            .update({
              current_step: status.current_step + 1,
              next_action_at: nextActionTime.toISOString(),
            })
            .eq("id", status.id);
        } else {
          await sb
            .from("lead_nurturing_status")
            .update({ completed: true, next_action_at: null })
            .eq("id", status.id);
        }

        actionsProcessed++;
      } catch (error) {
        console.error(`Error processing action for lead ${lead?.id}:`, error);
      }
    }

    // 2) Enroll new leads into active sequences
    const { data: activeSequences, error: seqErr } = await sb
      .from("nurturing_sequences")
      .select("*")
      .eq("active", true);

    if (seqErr) throw seqErr;

    for (const sequence of (activeSequences as unknown as SequenceRow[]) || []) {
      try {
        const tc = (sequence.trigger_conditions ?? {}) as any;

        if (sequence.trigger_type === "score_based") {
          const minScore = (tc.min_score ?? tc.minScore ?? 0) as number;

          const { data: leads } = await sb
            .from("leads")
            .select(`*, lead_nurturing_status!left (id)`)
            .gte("score", minScore)
            .is("lead_nurturing_status.id", null);

          await enrollLeads(sb, (leads as any[]) || [], sequence);
          leadsEnrolled += leads?.length || 0;
        }

        if (sequence.trigger_type === "status_change") {
          const statusTo = (tc.status_to ?? tc.status ?? tc.statusTo) as string | undefined;
          if (!statusTo) continue;

          const { data: leads } = await sb
            .from("leads")
            .select(`*, lead_nurturing_status!left (id)`)
            .eq("status", statusTo)
            .is("lead_nurturing_status.id", null);

          await enrollLeads(sb, (leads as any[]) || [], sequence);
          leadsEnrolled += leads?.length || 0;
        }
      } catch (error) {
        console.error(`Error processing sequence ${sequence.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        actions_processed: actionsProcessed,
        leads_enrolled: leadsEnrolled,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Lead nurturing error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function getCurrentStep(sb: DbClient, status: StatusRow): Promise<StepRow | null> {
  const { data, error } = await sb
    .from("nurturing_steps")
    .select("*")
    .eq("sequence_id", status.sequence_id)
    .eq("step_order", status.current_step)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as StepRow) ?? null;
}

async function enrollLeads(sb: DbClient, leads: any[], sequence: SequenceRow) {
  if (!leads?.length) return;

  const { data: firstStep, error } = await sb
    .from("nurturing_steps")
    .select("*")
    .eq("sequence_id", sequence.id)
    .eq("step_order", 1)
    .maybeSingle();

  if (error) throw error;
  if (!firstStep) return;

  const nextActionTime = new Date();
  nextActionTime.setHours(nextActionTime.getHours() + (firstStep as StepRow).delay_hours);

  const enrollments = leads.map((lead) => ({
    lead_id: lead.id,
    sequence_id: sequence.id,
    current_step: 1,
    next_action_at: nextActionTime.toISOString(),
    started_at: new Date().toISOString(),
  }));

  await sb.from("lead_nurturing_status").insert(enrollments as any);
}

async function executeAction(sb: DbClient, step: StepRow, lead: LeadRow, status: StatusRow) {
  const actionData = (step.action_data ?? {}) as any;

  switch (step.action_type) {
    case "email": {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      const toEmail =
        lead.email ||
        `${(lead.name || "lead").toLowerCase().replace(/\s+/g, ".")}@example.com`;

      const fromEmail = (actionData.from as string | undefined) || "onboarding@resend.dev";
      const subject = (actionData.subject as string | undefined) || "Follow-up from our team";

      const html =
        (actionData.html_content as string | undefined) ||
        (actionData.html_body as string | undefined) ||
        generateEmailTemplate(step.step_name, lead, actionData);

      const text =
        (actionData.text_content as string | undefined) ||
        `Hi ${lead.name || "there"},\n\n${step.step_name}\n\nBest regards,\nYour Team`;

      if (!RESEND_API_KEY) {
        await sb.from("outreach_logs").insert({
          lead_id: lead.id,
          method: "email",
          subject,
          template: actionData.template || "nurturing_email",
          body_preview: `⚠️ RESEND_API_KEY not configured - would send: ${step.step_name}`,
          sent_at: new Date().toISOString(),
          notes: `Would send nurturing email but RESEND_API_KEY not configured: ${step.step_name}`,
        } as any);
        return;
      }

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject,
            html,
            text,
          }),
        });

        const emailResult = await emailResponse.json().catch(() => ({}));

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${JSON.stringify(emailResult)}`);
        }

        await sb.from("outreach_logs").insert({
          lead_id: lead.id,
          method: "email",
          subject,
          template: actionData.template || "nurturing_email",
          body_preview: subject,
          sent_at: new Date().toISOString(),
          resend_email_id: emailResult.id, // Store Resend email ID for tracking
          notes: `✅ Sent via Resend (ID: ${emailResult.id}) - Nurturing sequence: ${step.step_name}`,
        } as any);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Email sending failed:", err);

        await sb.from("outreach_logs").insert({
          lead_id: lead.id,
          method: "email",
          subject,
          template: actionData.template || "nurturing_email",
          body_preview: `❌ Failed: ${message}`,
          sent_at: new Date().toISOString(),
          notes: `Email sending failed: ${message} - Sequence: ${step.step_name}`,
        } as any);
      }
      return;
    }

    case "task": {
      await sb.from("tasks").insert({
        title: actionData.title || `Follow up with ${lead.name || "lead"}`,
        description: actionData.description || `Automated task from nurturing sequence: ${step.step_name}`,
        status: "To Do",
        priority: actionData.priority || "Medium",
        due_date: actionData.due_days
          ? new Date(Date.now() + actionData.due_days * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : null,
      } as any);
      return;
    }

    case "status_change": {
      if (actionData.new_status) {
        await sb.from("leads").update({ status: actionData.new_status } as any).eq("id", lead.id);
      }
      return;
    }

    case "webhook": {
      if (actionData.webhook_url) {
        try {
          await fetch(actionData.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "nurturing_action",
              step_name: step.step_name,
              lead,
              sequence_id: status.sequence_id,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Webhook failed:", err);
        }
      }
      return;
    }

    default:
      console.warn(`Unknown action_type: ${step.action_type}`);
  }
}

function generateEmailTemplate(stepName: string, lead: LeadRow, actionData: any): string {
  const leadName = lead.name || "there";
  const companyName = actionData.company_name || "Our Team";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${actionData.subject || "Follow-up"}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px;">Hi ${leadName}!</h1>
        <p style="margin: 0; color: #6b7280; font-size: 16px;">${actionData.greeting || "Following up on your interest in our services."}</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${
          actionData.html_body ||
          `
            <p>We wanted to reach out and see how we can help you achieve your goals.</p>
            <p><strong>Next step:</strong> ${stepName}</p>
            <p>Would you like to schedule a quick 15-minute call?</p>
          `
        }

        <div style="margin: 30px 0; text-align: center;">
          <a href="${actionData.cta_url || "https://example.com"}"
            style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
            ${actionData.cta_text || "Schedule a Call"}
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          Best regards,<br>
          ${companyName}<br>
          <small>This email was sent as part of our nurturing sequence: ${stepName}</small>
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>
          Don't want to receive these emails?
          <a href="${actionData.unsubscribe_url || "#"}" style="color: #6b7280;">Unsubscribe here</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
