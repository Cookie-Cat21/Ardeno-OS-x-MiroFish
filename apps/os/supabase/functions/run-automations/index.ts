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
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const notifications: any[] = [];

    // 1. Check proposals needing follow-up (sent > 3 days ago, still pending)
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const { data: staleProp } = await sb.from("proposals")
      .select("*")
      .eq("result", "Pending")
      .eq("status", "Sent")
      .lt("sent_at", threeDaysAgo);

    for (const p of staleProp || []) {
      notifications.push({
        type: "follow_up",
        title: "Proposal Follow-up Due",
        message: `"${p.title}" was sent ${Math.round((Date.now() - new Date(p.sent_at).getTime()) / 86400000)} days ago. Time to follow up.`,
        link: "/proposals",
      });
    }

    // 2. Check overdue tasks
    const today = new Date().toISOString().split("T")[0];
    const { data: overdueTasks } = await sb.from("tasks")
      .select("*")
      .neq("status", "Done")
      .lt("due_date", today);

    if ((overdueTasks?.length || 0) > 0) {
      notifications.push({
        type: "overdue",
        title: `${overdueTasks!.length} Overdue Tasks`,
        message: `You have ${overdueTasks!.length} tasks past their due date.`,
        link: "/tasks",
      });
    }

    // 3. Check unprocessed intake submissions
    const { data: newIntakes } = await sb.from("intake_submissions")
      .select("*")
      .eq("processed", false);

    for (const intake of newIntakes || []) {
      notifications.push({
        type: "intake",
        title: "Unprocessed Intake",
        message: `${intake.name} submitted an intake form and hasn't been processed yet.`,
        link: "/intake",
      });
    }

    // 4. Check deals with no recent contact (> 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const { data: staleDeals } = await sb.from("pipeline_deals")
      .select("*")
      .not("stage", "in", '("Closed Won","Closed Dead")')
      .lt("last_contact", sevenDaysAgo);

    if ((staleDeals?.length || 0) > 0) {
      notifications.push({
        type: "stale_deal",
        title: `${staleDeals!.length} Stale Deals`,
        message: `${staleDeals!.length} deals haven't been contacted in over a week.`,
        link: "/pipeline",
      });
    }

    // 5. Auto-create invoices for won proposals without invoices
    const { data: wonProposals } = await sb.from("proposals")
      .select("*")
      .eq("result", "Won");

    for (const prop of wonProposals || []) {
      const { data: existing } = await sb.from("invoices")
        .select("id")
        .eq("proposal_id", prop.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`;
        await sb.from("invoices").insert({
          proposal_id: prop.id,
          client_id: prop.client_id,
          project_id: prop.project_id,
          invoice_number: invoiceNum,
          amount: prop.value || 0,
          status: "Draft",
          items: [{ description: prop.title, amount: prop.value || 0 }],
        });
        notifications.push({
          type: "invoice_created",
          title: "Invoice Auto-Generated",
          message: `Invoice ${invoiceNum} created from won proposal "${prop.title}".`,
          link: "/invoices",
        });
      }
    }

    // Save notifications
    if (notifications.length > 0) {
      await sb.from("notification_log").insert(notifications);

      // Send email summary via Resend
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        try {
          const emailHtml = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#6366f1;">🔔 Ardeno OS — Automation Report</h2>
              <p style="color:#666;">Found <strong>${notifications.length}</strong> item(s) that need your attention:</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
              ${notifications.map(n => `
                <div style="padding:12px;margin-bottom:8px;background:#f9fafb;border-radius:8px;border-left:4px solid ${n.type === 'overdue' ? '#ef4444' : n.type === 'follow_up' ? '#f59e0b' : '#6366f1'};">
                  <strong>${n.title}</strong><br/>
                  <span style="color:#666;font-size:14px;">${n.message}</span>
                </div>
              `).join('')}
              <p style="color:#999;font-size:12px;margin-top:24px;">Auto-generated by Ardeno OS at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })} IST</p>
            </div>
          `;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Ardeno OS <onboarding@resend.dev>",
              to: ["ardenostudio@gmail.com"],
              subject: `🔔 Ardeno OS: ${notifications.length} automation alert(s)`,
              html: emailHtml,
            }),
          });
          console.log("Email notification sent");
        } catch (emailErr) {
          console.error("Email send failed:", emailErr);
        }
      }
      
      // Send WhatsApp notifications via Zapier webhook
      const WHATSAPP_WEBHOOK = Deno.env.get("WHATSAPP_WEBHOOK_URL");
      if (WHATSAPP_WEBHOOK) {
        try {
          const summary = notifications.map(n => `• ${n.title}: ${n.message}`).join('\n');
          await fetch(WHATSAPP_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `🔔 Ardeno OS: ${notifications.length} alert(s)`,
              message: summary,
              type: "automation_summary",
              timestamp: new Date().toISOString(),
              source: "Ardeno OS"
            }),
          });
          console.log("WhatsApp notification sent");
        } catch (whatsappErr) {
          console.error("WhatsApp webhook failed:", whatsappErr);
        }
      }
    }

    return new Response(JSON.stringify({ notifications_created: notifications.length, details: notifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("automation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
