// ============================================================
// Ardeno OS – Edge Function: security-scan
//
// Simulates a vulnerability scan for a project.
// Higher-risk stages (Build, Security) have more chance of findings.
//
// Deploy: supabase functions deploy security-scan --no-verify-jwt
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Severity = "low" | "medium" | "high" | "critical";

interface Vulnerability {
  type:        string;
  severity:    Severity;
  description: string;
}

const VULN_POOL: Vulnerability[] = [
  { type: "SQL Injection",     severity: "critical", description: "Unparameterised query in user search endpoint" },
  { type: "XSS",               severity: "high",     description: "Reflected user input not sanitised in output" },
  { type: "CSRF",              severity: "high",     description: "Missing CSRF token on state-changing forms" },
  { type: "Insecure Deps",     severity: "medium",   description: "3 npm packages with known CVEs" },
  { type: "Exposed Secrets",   severity: "critical", description: "API key pattern detected in source" },
  { type: "Missing HTTPS",     severity: "medium",   description: "Mixed content: some resources loaded over HTTP" },
  { type: "Weak Auth",         severity: "high",     description: "JWT algorithm set to 'none' in dev config" },
  { type: "Open Redirect",     severity: "medium",   description: "Unvalidated redirect target in login flow" },
  { type: "Info Disclosure",   severity: "low",      description: "Stack trace exposed in error response" },
  { type: "Rate Limiting",     severity: "low",      description: "No rate limit on authentication endpoint" },
];

const STAGE_VULN_CHANCE: Record<string, number> = {
  Intake:   0.05, Quote:  0.10, Design: 0.20,
  Build:    0.55, Security: 0.70, Deploy: 0.30, Done: 0.10,
};

const SEVERITY_RISK_DELTA: Record<Severity, number> = {
  critical: 18, high: 10, medium: 5, low: 2,
};

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickVulns(stage: string): Vulnerability[] {
  const chance = STAGE_VULN_CHANCE[stage] ?? 0.2;
  if (Math.random() > chance) return [];

  const count = randBetween(1, stage === "Security" || stage === "Build" ? 4 : 2);
  const shuffled = [...VULN_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) throw new Error("project_id required");

    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, title, stage, risk_score")
      .eq("id", project_id)
      .single();

    if (fetchErr || !project) throw new Error(fetchErr?.message ?? "Project not found");

    const vulns      = pickVulns(project.stage as string);
    const riskDelta  = vulns.reduce((sum, v) => sum + SEVERITY_RISK_DELTA[v.severity], 0);
    const newRisk    = Math.min(100, (project.risk_score as number) + riskDelta);

    // Insert scan result
    const { error: scanErr } = await supabase.from("security_scans").insert({
      project_id,
      vulns_found: vulns.length,
      details:     vulns,
      risk_delta:  riskDelta,
    });
    if (scanErr) throw new Error(scanErr.message);

    // Update project risk if vulns found
    if (riskDelta > 0) {
      await supabase.from("projects").update({ risk_score: newRisk }).eq("id", project_id);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      action:      "security_scan_completed",
      entity_type: "project",
      entity_id:   project_id,
      meta:        { vulns_found: vulns.length, risk_delta: riskDelta, stage: project.stage },
    });

    // Telegram notify if vulns found
    const token   = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const groupId = Deno.env.get("TELEGRAM_GROUP_ID");
    if (token && groupId && vulns.length > 0) {
      const highSeverity = vulns.filter(v => v.severity === "critical" || v.severity === "high");
      const msg =
        `🔴 <b>Security Alert: ${project.title}</b>\n` +
        `${vulns.length} issue(s) found · ${highSeverity.length} high/critical\n` +
        `Risk score increased by +${riskDelta}% → now ${newRisk}%\n` +
        `Stage: <b>${project.stage}</b>\n\n` +
        vulns.slice(0, 3).map(v => `• ${v.type} (${v.severity}): ${v.description}`).join("\n");

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: groupId, text: msg, parse_mode: "HTML" }),
      }).catch(console.warn);
    }

    return new Response(
      JSON.stringify({
        success: true, project_id,
        vulns_found: vulns.length, details: vulns, risk_delta: riskDelta, new_risk: newRisk,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
