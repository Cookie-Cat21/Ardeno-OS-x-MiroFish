/**
 * Ardeno OS — consensus-review Edge Function
 * Simulates 3 AI agents voting on a project stage.
 * Iteration 8: skills now influence agent scores (+bonus if success_rate > 85)
 *
 * Deploy: supabase functions deploy consensus-review
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Agent definitions ─────────────────────────────────────────────────────

interface AgentDef {
  name:       string;
  role:       string;
  weight:     number;
  scoreRange: [number, number];
  stageBonus: Partial<Record<string, number>>;
  category:   string;
}

const AGENTS: AgentDef[] = [
  {
    name:       'Frontend Agent',
    role:       'UI/UX Evaluator',
    weight:     1.0,
    scoreRange: [60, 95],
    stageBonus: { Design: 8, Build: 5 },
    category:   'Frontend',
  },
  {
    name:       'Security Agent',
    role:       'Threat Analyst',
    weight:     1.5,
    scoreRange: [55, 90],
    stageBonus: { Security: 10, Deploy: 6 },
    category:   'Security',
  },
  {
    name:       'Lead Dev Agent',
    role:       'Architecture Lead',
    weight:     2.0,
    scoreRange: [65, 98],
    stageBonus: { Build: 8, Deploy: 5, Done: 3 },
    category:   'Backend',
  },
];

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function deriveRisk(consensus: number): number {
  if (consensus >= 80) return randBetween(5, 35);
  if (consensus >= 65) return randBetween(35, 60);
  return randBetween(60, 90);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    // ── Fetch project ────────────────────────────────────────────────────
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('id, title, stage, tenant_id')
      .eq('id', project_id)
      .single();

    if (pErr || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ── Fetch high-performing skills (success_rate > 85) ──────────────────
    // These skills grant a bonus to the matching agent's score.
    const SKILL_BONUS_PER_SKILL = 4;
    const { data: topSkills = [] } = await supabase
      .from('skills')
      .select('id, name, category, success_rate, usage_count')
      .gt('success_rate', 85)
      .order('success_rate', { ascending: false });

    // Build category → cumulative bonus map
    const categoryBonus: Record<string, number> = {};
    const categorySkillIds: Record<string, string[]> = {};
    for (const skill of topSkills) {
      const cat = String(skill.category ?? '');
      categoryBonus[cat]    = (categoryBonus[cat] ?? 0) + SKILL_BONUS_PER_SKILL;
      categorySkillIds[cat] = [...(categorySkillIds[cat] ?? []), skill.id];
    }

    // ── Simulate agent votes ─────────────────────────────────────────────
    const stage = project.stage as string;

    const votes = AGENTS.map(agent => {
      const base      = randBetween(...agent.scoreRange);
      const stageBon  = agent.stageBonus[stage] ?? 0;
      const skillBon  = Math.min(categoryBonus[agent.category] ?? 0, 12); // cap skill bonus at 12
      const finalScore = clamp(base + stageBon + skillBon, 0, 100);
      const riskScore  = deriveRisk(finalScore);

      return {
        agent,
        rawScore:    base,
        finalScore,
        riskScore,
        skillBonus:  skillBon,
        notes: skillBon > 0
          ? `${agent.role} evaluated ${stage} stage. Skill bonus: +${skillBon}pts.`
          : `${agent.role} evaluated ${stage} stage.`,
      };
    });

    // ── Weighted consensus ───────────────────────────────────────────────
    const totalWeight    = AGENTS.reduce((s, a) => s + a.weight, 0);
    const weightedSum    = votes.reduce((s, v) => s + v.finalScore * v.agent.weight, 0);
    const consensusScore = clamp(Math.round(weightedSum / totalWeight), 0, 100);
    const avgRisk        = clamp(Math.round(votes.reduce((s, v) => s + v.riskScore, 0) / votes.length), 0, 100);

    // ── Insert agent_reviews ─────────────────────────────────────────────
    const reviewRows = votes.map(v => ({
      project_id,
      agent_name:      v.agent.name,
      consensus_score: v.finalScore,
      risk_score:      v.riskScore,
      notes:           v.notes,
      stage_reviewed:  stage,
    }));
    await supabase.from('agent_reviews').insert(reviewRows);

    // ── Update project scores ────────────────────────────────────────────
    await supabase
      .from('projects')
      .update({ consensus_score: consensusScore, risk_score: avgRisk })
      .eq('id', project_id);

    // ── Increment skill usage + insert skill_usages rows ─────────────────
    const appliedSkillIds: string[] = [];
    for (const agent of AGENTS) {
      const ids = categorySkillIds[agent.category] ?? [];
      appliedSkillIds.push(...ids);
    }
    const uniqueSkillIds = [...new Set(appliedSkillIds)];

    for (const skillId of uniqueSkillIds) {
      await supabase.rpc('increment_skill_usage', { skill_id: skillId });
    }

    if (uniqueSkillIds.length > 0) {
      const usageRows = uniqueSkillIds.map(skillId => {
        const skill = topSkills.find(s => s.id === skillId);
        const agent = AGENTS.find(a => a.category === skill?.category);
        return {
          skill_id:   skillId,
          project_id,
          agent_name: agent?.name ?? 'System',
          bonus_pts:  SKILL_BONUS_PER_SKILL,
        };
      });
      await supabase.from('skill_usages').insert(usageRows);
    }

    // ── Write audit log ──────────────────────────────────────────────────
    await supabase.from('audit_logs').insert({
      project_id,
      action: 'agent_review',
      actor:  'system',
      meta: {
        consensus_score:  consensusScore,
        risk_score:       avgRisk,
        stage,
        agents_voted:     votes.length,
        skills_applied:   uniqueSkillIds.length,
        skill_categories: Object.keys(categoryBonus).filter(k => categoryBonus[k] > 0),
        votes: votes.map(v => ({
          agent:       v.agent.name,
          score:       v.finalScore,
          risk:        v.riskScore,
          skill_bonus: v.skillBonus,
        })),
      },
    });

    // ── Telegram: general alert if concerning ────────────────────────────
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId   = Deno.env.get('TELEGRAM_GROUP_ID');
    const needsAlert = consensusScore < 70 || avgRisk > 70;

    if (botToken && chatId && needsAlert) {
      const emoji = avgRisk > 70 ? '🔴' : '⚠️';
      const msg =
        `${emoji} *Agent Review Alert*\n` +
        `Project: *${project.title}*\n` +
        `Stage: ${stage}\n` +
        `Consensus: ${consensusScore}% | Risk: ${avgRisk}%\n` +
        (uniqueSkillIds.length > 0 ? `Skills applied: ${uniqueSkillIds.length}\n` : '') +
        `Review required before proceeding.`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
      });
    }

    // ── Telegram: Deployment escalation alert ────────────────────────────
    // When stage → Deploy and consensus < 80%, demand manual approval.
    const needsDeployApproval = stage === 'Deploy' && consensusScore < 80;
    if (needsDeployApproval && botToken && chatId) {
      const escalationMsg =
        `🚀 *Deployment Needs Approval*\n` +
        `Project: *${project.title}*\n` +
        `ID: \`${project_id}\`\n` +
        `Consensus: ${consensusScore}% (threshold: 80%)\n` +
        `Risk Score: ${avgRisk}%\n\n` +
        `Reply \`/approve ${project_id}\` to proceed with deployment.`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text: escalationMsg, parse_mode: 'Markdown' }),
      });
    }

    return new Response(
      JSON.stringify({
        success:          true,
        consensus_score:  consensusScore,
        risk_score:       avgRisk,
        reviews_created:  reviewRows.length,
        skills_applied:   uniqueSkillIds.length,
        needs_escalation: needsDeployApproval,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[consensus-review] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
