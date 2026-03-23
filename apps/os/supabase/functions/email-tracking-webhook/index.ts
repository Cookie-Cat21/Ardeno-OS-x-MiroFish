import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookEvent = await req.json();
    console.log("Received webhook event:", JSON.stringify(webhookEvent, null, 2));

    const supabase = getServiceClient();
    const { type, data } = webhookEvent;

    // Extract email ID from the event data
    const emailId = data.id;
    if (!emailId) {
      throw new Error("No email ID found in webhook event");
    }

    // Determine what to update based on the event type
    let updateData = {};
    let logNote = "";

    switch (type) {
      case "email.opened":
        updateData = { opened: true };
        logNote = `✅ Email opened at ${new Date().toISOString()}`;
        break;

      case "email.clicked":
        updateData = { opened: true }; // If clicked, it was also opened
        logNote = `🔗 Email clicked at ${new Date().toISOString()}`;
        break;

      case "email.bounced":
        logNote = `❌ Email bounced: ${data.bounce_reason || 'Unknown reason'}`;
        break;

      case "email.complained":
        logNote = `⚠️ Email marked as spam at ${new Date().toISOString()}`;
        break;

      case "email.delivered":
        logNote = `📧 Email delivered at ${new Date().toISOString()}`;
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
        return new Response(
          JSON.stringify({ message: `Event type ${type} not handled` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Find the outreach log entry by resend_email_id
    const { data: existingLog, error: findError } = await supabase
      .from("outreach_logs")
      .select("*")
      .eq("resend_email_id", emailId)
      .maybeSingle();

    if (findError) {
      throw new Error(`Error finding outreach log: ${findError.message}`);
    }

    if (!existingLog) {
      console.warn(`No outreach log found for Resend email ID: ${emailId}`);
      return new Response(
        JSON.stringify({ message: "Email not found in outreach logs" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the outreach log with tracking data
    const updatedNotes = existingLog.notes 
      ? `${existingLog.notes}\n${logNote}`
      : logNote;

    const { error: updateError } = await supabase
      .from("outreach_logs")
      .update({
        ...updateData,
        notes: updatedNotes,
      })
      .eq("resend_email_id", emailId);

    if (updateError) {
      throw new Error(`Error updating outreach log: ${updateError.message}`);
    }

    console.log(`Successfully processed ${type} event for email ${emailId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_type: type,
        email_id: emailId,
        updated: Object.keys(updateData).length > 0 ? updateData : "notes only"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});