/**
 * Ardeno OS — telegram-bot Edge Function
 *
 * Real two-way Telegram integration:
 *   Telegram (phone) → webhook → this function → Supabase / Orchestrator → back to Telegram
 *
 * ── Commands ─────────────────────────────────────────────────────────────────
 *   /start              Welcome message
 *   /help               List all commands
 *   /status             Live pipeline snapshot (real Supabase data)
 *   /projects           List active projects
 *   /risk               High-risk projects (risk_score > 70)
 *   /agents             Agent workforce stats (143 AI agents)
 *   /task <text>        Run full orchestration on <text>
 *   <any other text>    Treated as an orchestration task
 *
 * ── Setup (one-time) ─────────────────────────────────────────────────────────
 *   1. @BotFather → /newbot → copy the TOKEN
 *   2. Supabase Dashboard → Edge Functions → telegram-bot → Secrets:
 *        TELEGRAM_BOT_TOKEN = <token>
 *        TELEGRAM_SECRET_TOKEN = <any random string — e.g. "ardeno2026">
 *   3. Deploy: supabase functions deploy telegram-bot --no-verify-jwt
 *   4. Register webhook (run once in browser):
 *        https://api.telegram.org/bot<TOKEN>/setWebhook
 *          ?url=<SUPABASE_URL>/functions/v1/telegram-bot
 *          &secret_token=<TELEGRAM_SECRET_TOKEN>
 *
 * Required secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_TOKEN
 * Auto-available:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(text: string): string {
  // Escape HTML special chars for Telegram HTML mode
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTg(
  token:     string,
  chatId:    number,
  text:      string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  });
}

// ─── Result formatter ─────────────────────────────────────────────────────────
const DEPT_SHORT: Record<string, string> = {
  global: 'Global', commercial_growth: 'Sales', design_identity: 'Design',
  development_engineering: 'Dev', operations_portal: 'Ops',
  analytics_ai_research: 'Analytics', security_compliance: 'Security',
  finance_legal: 'Finance', localization_accessibility: 'L10n',
  innovation_rd: 'Innovation', cross_cutting: 'Cross', quality: 'QA',
  validators: 'Validators', synthetic_testers: 'Testers',
  content_studio: 'Content', revenue_operations: 'Revenue',
  client_intelligence: 'Intel', platform_specialists: 'Platforms',
  knowledge_ops: 'Knowledge',
};

// deno-lint-ignore no-explicit-any
function formatOrchResult(plan: any, results: any[]): string[] {
  const msgs: string[] = [];

  // ── Message 1: Summary + agent pills ─────────────────────────────────────
  const success = results.filter(r => !r.error).length;
  const errors  = results.filter(r =>  r.error).length;

  let header = `⚡ <b>Ardeno OS — Orchestration Complete</b>\n\n`;
  header += `📋 <b>Summary</b>\n${esc(plan.summary)}\n\n`;

  const pills = results.map(r => {
    const dept  = r.dept ? DEPT_SHORT[r.dept] ?? r.dept : '';
    const icon  = r.error ? '❌' : '✅';
    const label = dept ? `${r.agent_name} [${dept}]` : r.agent_name;
    return `${icon} ${esc(label)}`;
  }).join('  ·  ');
  header += pills + `\n\n`;
  header += `<i>✅ ${success} agent${success !== 1 ? 's' : ''} completed`;
  if (errors) header += ` · ⚠️ ${errors} error${errors !== 1 ? 's' : ''}`;
  header += `</i>`;
  msgs.push(header);

  // ── Messages 2+: Agent outputs (chunked to ≤ 4000 chars) ─────────────────
  let chunk = '';
  for (const r of results) {
    const dept = r.dept ? ` <i>[${DEPT_SHORT[r.dept] ?? r.dept}]</i>` : '';
    const icon = r.error ? '❌' : '✅';
    // Truncate individual result at 350 chars to keep Telegram messages readable
    const snippet  = r.result.replace(/<[^>]+>/g, '').slice(0, 350);
    const overflow = r.result.length > 350;

    const block =
      `${icon} <b>${esc(r.agent_name)}</b>${dept}\n` +
      `<i>📌 ${esc(r.task.slice(0, 120))}${r.task.length > 120 ? '…' : ''}</i>\n\n` +
      `${esc(snippet)}${overflow ? '\n<i>…(full output in Ardeno OS)</i>' : ''}\n` +
      `━━━━━━━━━━━━\n`;

    if ((chunk + block).length > 3900) {
      if (chunk) msgs.push(chunk.trim());
      chunk = block;
    } else {
      chunk += block;
    }
  }
  if (chunk.trim()) msgs.push(chunk.trim());

  return msgs;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Validate Telegram secret token
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = Deno.env.get('TELEGRAM_SECRET_TOKEN');
  if (expectedSecret && secretToken !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (req.method !== 'POST') {
    return new Response('Ardeno OS Telegram Bot — webhook active', { status: 200 });
  }

  const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
  const sbUrl   = Deno.env.get('SUPABASE_URL')!;
  const sbKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sbAnon  = Deno.env.get('SUPABASE_ANON_KEY')!;

  const db = createClient(sbUrl, sbKey);

  // Parse Telegram update
  // deno-lint-ignore no-explicit-any
  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response('ok', { status: 200 });
  }

  const message = update.message ?? update.edited_message;
  if (!message?.text) return new Response('ok', { status: 200 }); // non-text

  const chatId    = message.chat.id as number;
  const firstName = (message.from?.first_name ?? 'there') as string;
  const rawText   = (message.text as string).trim();

  // ── /start ──────────────────────────────────────────────────────────────
  if (rawText === '/start') {
    await sendTg(tgToken, chatId,
      `👋 <b>Hey ${esc(firstName)}! I'm Ardeno OS.</b>\n\n` +
      `I can run your full AI workforce from here.\n\n` +
      `Type <b>/help</b> to see all commands, or just send me any task and I'll orchestrate it.`
    );
    return new Response('ok', { status: 200 });
  }

  // ── /help ───────────────────────────────────────────────────────────────
  if (rawText === '/help') {
    await sendTg(tgToken, chatId,
      `📋 <b>Ardeno OS Commands</b>\n\n` +
      `/status — Live pipeline snapshot\n` +
      `/projects — Active project list\n` +
      `/risk — High-risk projects\n` +
      `/agents — AI workforce stats\n` +
      `/task &lt;description&gt; — Run orchestration\n\n` +
      `<i>💡 Or just send any message — it'll be orchestrated automatically.</i>`
    );
    return new Response('ok', { status: 200 });
  }

  // ── /status ─────────────────────────────────────────────────────────────
  if (rawText === '/status') {
    const { data: projects } = await db
      .from('projects')
      .select('id, stage, risk_score');

    if (!projects?.length) {
      await sendTg(tgToken, chatId, '📊 <b>Pipeline Status</b>\n\nNo projects found.');
      return new Response('ok', { status: 200 });
    }

    const total  = projects.length;
    const active = projects.filter((p: any) => p.stage !== 'Done').length;
    const done   = projects.filter((p: any) => p.stage === 'Done').length;
    const avgRisk = Math.round(
      projects.reduce((s: number, p: any) => s + (p.risk_score ?? 0), 0) / total
    );
    const highRisk = projects.filter((p: any) => (p.risk_score ?? 0) > 70).length;

    await sendTg(tgToken, chatId,
      `📊 <b>Pipeline Status</b>\n\n` +
      `Total projects: <b>${total}</b>\n` +
      `Active: <b>${active}</b>\n` +
      `Completed: <b>${done}</b>\n` +
      `Avg risk: <b>${avgRisk}%</b>\n` +
      `High-risk: <b>${highRisk}</b> ${highRisk > 0 ? '⚠️' : '✅'}`
    );
    return new Response('ok', { status: 200 });
  }

  // ── /projects ───────────────────────────────────────────────────────────
  if (rawText === '/projects') {
    const { data: projects } = await db
      .from('projects')
      .select('id, title, stage, risk_score, client_name')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!projects?.length) {
      await sendTg(tgToken, chatId, '📋 No projects found.');
      return new Response('ok', { status: 200 });
    }

    const list = (projects as any[]).map((p: any) =>
      `• <b>${esc(p.title ?? p.client_name ?? 'Untitled')}</b> [${esc(p.stage ?? '—')}] — Risk: ${p.risk_score ?? 0}%`
    ).join('\n');

    await sendTg(tgToken, chatId,
      `📋 <b>Active Projects (${projects.length})</b>\n\n${list}`
    );
    return new Response('ok', { status: 200 });
  }

  // ── /risk ────────────────────────────────────────────────────────────────
  if (rawText === '/risk') {
    const { data: projects } = await db
      .from('projects')
      .select('id, title, stage, risk_score, client_name')
      .gt('risk_score', 70)
      .order('risk_score', { ascending: false });

    if (!projects?.length) {
      await sendTg(tgToken, chatId, '✅ No high-risk projects right now!');
      return new Response('ok', { status: 200 });
    }

    const list = (projects as any[]).map((p: any) =>
      `⚠️ <b>${esc(p.title ?? p.client_name ?? 'Untitled')}</b> — Risk: ${p.risk_score}%`
    ).join('\n');

    await sendTg(tgToken, chatId,
      `🚨 <b>High-Risk Projects (${projects.length})</b>\n\n${list}`
    );
    return new Response('ok', { status: 200 });
  }

  // ── /agents ─────────────────────────────────────────────────────────────
  if (rawText === '/agents') {
    // Fetch custom agents from DB; AGENT_CATALOG is frontend-only (143 agents)
    const { count: customCount } = await db
      .from('custom_agents')
      .select('*', { count: 'exact', head: true });

    await sendTg(tgToken, chatId,
      `🤖 <b>AI Workforce — Ardeno OS</b>\n\n` +
      `🧠 Catalog agents: <b>143</b> across 19 departments\n` +
      `⚙️ Custom agents: <b>${customCount ?? 0}</b>\n\n` +
      `<b>Department Supervisors</b>\n` +
      `🟢 The Closer (Commercial)\n` +
      `🟢 Creative Director (Design)\n` +
      `🟢 The Lead Dev (Dev)\n` +
      `🟢 Strategy Advisor (Analytics)\n` +
      `🟢 Financial Controller (Finance)\n` +
      `🟢 Content Strategist (Content)\n` +
      `🟢 + 7 more supervisors\n\n` +
      `<i>💡 Use /task to dispatch a multi-agent job.</i>`
    );
    return new Response('ok', { status: 200 });
  }

  // ── /task <text> or any free-form message → Orchestrate ──────────────────
  const task = rawText.startsWith('/task ')
    ? rawText.slice(6).trim()
    : rawText.startsWith('/')
    ? null          // unknown slash command
    : rawText;

  if (!task) {
    await sendTg(tgToken, chatId,
      `❓ Unknown command. Type /help for the full list.`
    );
    return new Response('ok', { status: 200 });
  }

  // Acknowledge immediately so the user knows something is happening
  await sendTg(tgToken, chatId,
    `⚡ <b>Orchestrating…</b>\n\n` +
    `<i>"${esc(task.slice(0, 120))}${task.length > 120 ? '…' : ''}"</i>\n\n` +
    `Dispatching to relevant agents — this takes ~30s.`
  );

  // Log to audit_logs
  await db.from('audit_logs').insert({
    action:      'telegram_orchestrate',
    entity_type: 'telegram',
    meta:        { task: task.slice(0, 500), chat_id: chatId, user: firstName },
  }).then(() => {/* fire and forget */});

  // Call orchestrate edge function
  let orchData: any = null;
  try {
    const orchRes = await fetch(`${sbUrl}/functions/v1/orchestrate`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${sbAnon}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ task }),
    });
    orchData = await orchRes.json();
  } catch (err) {
    await sendTg(tgToken, chatId,
      `❌ <b>Orchestration failed</b>\n\n${esc(err instanceof Error ? err.message : 'Unknown error')}`
    );
    return new Response('ok', { status: 200 });
  }

  if (orchData?.error) {
    await sendTg(tgToken, chatId,
      `❌ <b>Orchestration error:</b> ${esc(orchData.error)}`
    );
    return new Response('ok', { status: 200 });
  }

  // Format and send all result messages
  const messages = formatOrchResult(orchData.plan, orchData.results);
  for (const msg of messages) {
    await sendTg(tgToken, chatId, msg);
  }

  return new Response('ok', { status: 200 });
});
