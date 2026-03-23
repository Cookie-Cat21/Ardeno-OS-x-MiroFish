import { useRef, useState } from 'react';
import { Send, Bot, Loader2, CheckCheck, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Project, TelegramMessage } from '@/types';
import { uid } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useActivity } from '@/context/ActivityContext';
import { AGENT_CATALOG } from '@/lib/agents';

interface TelegramPanelProps {
  projects?: Project[];
}

// ── Dept short labels (matches orchestrate edge function) ──────────────────────
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

const INITIAL_MSGS: TelegramMessage[] = [
  {
    id:        'init-1',
    role:      'bot',
    text:      '🤖 <b>Ardeno OS Agent connected.</b>\n\nType /help for commands, or just send a task and I\'ll orchestrate it.',
    timestamp: new Date(),
  },
];

// ── Sync command handler ───────────────────────────────────────────────────────
function handleSyncCommand(
  cmd: string,
  projects: Project[],
): { text: string; actions?: TelegramMessage['actions'] } | null {
  if (cmd === '/help') {
    return { text: [
      '📋 <b>Available Commands</b>',
      '',
      '/status — Pipeline snapshot',
      '/projects — List active projects',
      '/risk — High-risk projects',
      '/agents — AI workforce stats',
      '/orchestrate &lt;task&gt; — Run full AI orchestration',
      '/clear — Clear chat',
      '',
      '<i>💡 Or just type any task directly — it goes straight to the orchestrator.</i>',
    ].join('\n') };
  }

  if (cmd === '/status') {
    const total   = projects.length;
    const active  = projects.filter(p => p.stage !== 'Done').length;
    const done    = projects.filter(p => p.stage === 'Done').length;
    const avgRisk = total
      ? Math.round(projects.reduce((s, p) => s + (p.risk_score ?? 0), 0) / total)
      : 0;
    const highRisk = projects.filter(p => (p.risk_score ?? 0) > 70).length;
    return {
      text: `📊 <b>Pipeline Status</b>\n\nTotal: <b>${total}</b>\nActive: <b>${active}</b>\nCompleted: <b>${done}</b>\nAvg risk: <b>${avgRisk}%</b>\nHigh-risk: <b>${highRisk}</b> ${highRisk > 0 ? '⚠️' : '✅'}`,
    };
  }

  if (cmd === '/projects') {
    if (!projects.length) return { text: '📋 No projects found.' };
    const list = projects.slice(0, 8).map(p =>
      `• <b>${p.title ?? p.client_name ?? 'Untitled'}</b> [${p.stage}] — Risk: ${p.risk_score ?? 0}%`
    ).join('\n');
    return { text: `📋 <b>Projects (${projects.length})</b>\n\n${list}` };
  }

  if (cmd === '/risk') {
    const highRisk = projects.filter(p => (p.risk_score ?? 0) > 70);
    if (!highRisk.length) return { text: '✅ No high-risk projects right now!' };
    const list = highRisk.map(p =>
      `⚠️ <b>${p.title ?? p.client_name ?? 'Untitled'}</b> — Risk: ${p.risk_score}%`
    ).join('\n');
    return { text: `🚨 <b>High-Risk Projects (${highRisk.length})</b>\n\n${list}` };
  }

  if (cmd === '/agents') {
    const total = AGENT_CATALOG.length;
    const enabled = AGENT_CATALOG.filter(a => a.enabled).length;
    return {
      text: [
        '🤖 <b>AI Workforce — Ardeno OS</b>',
        '',
        `🧠 Total catalog agents: <b>${total}</b>`,
        `🟢 Active (enabled): <b>${enabled}</b>`,
        '',
        '<b>Orchestration Supervisors</b>',
        '🟢 The Closer — Commercial',
        '🟢 Creative Director — Design',
        '🟢 The Lead Dev — Dev',
        '🟢 Strategy Advisor — Analytics',
        '🟢 Financial Controller — Finance',
        '🟢 Content Strategist — Content',
        '🟢 + 7 more department supervisors',
        '',
        '<i>💡 Use /orchestrate to dispatch a multi-agent job.</i>',
      ].join('\n'),
    };
  }

  return null; // not a sync command
}

// ── Orchestration result formatter ────────────────────────────────────────────
// deno-lint-ignore no-explicit-any is frontend, use any
function formatOrchResult(plan: any, results: any[]): TelegramMessage[] {
  const msgs: TelegramMessage[] = [];
  const success = results.filter(r => !r.error).length;
  const errors  = results.filter(r =>  r.error).length;

  // Summary message
  const pills = results.map(r => {
    const dept  = r.dept ? (DEPT_SHORT[r.dept] ?? r.dept) : '';
    const icon  = r.error ? '❌' : '✅';
    return `${icon} ${r.agent_name}${dept ? ` [${dept}]` : ''}`;
  }).join('\n');

  msgs.push({
    id:   uid(),
    role: 'bot',
    text: `⚡ <b>Orchestration Complete</b>\n\n${plan.summary}\n\n${pills}\n\n<i>✅ ${success} completed${errors ? ` · ⚠️ ${errors} error${errors > 1 ? 's' : ''}` : ''}</i>`,
    timestamp: new Date(),
  });

  // Individual agent outputs (brief)
  for (const r of results) {
    const dept    = r.dept ? (DEPT_SHORT[r.dept] ?? r.dept) : '';
    const icon    = r.error ? '❌' : '✅';
    const snippet = r.result.slice(0, 280);
    const more    = r.result.length > 280;

    msgs.push({
      id:   uid(),
      role: 'bot',
      text: `${icon} <b>${r.agent_name}</b>${dept ? ` <i>[${dept}]</i>` : ''}\n<i>${r.task.slice(0, 100)}${r.task.length > 100 ? '…' : ''}</i>\n\n${snippet}${more ? '\n<i>…(full output in Ardeno OS)</i>' : ''}`,
      timestamp: new Date(),
    });
  }

  return msgs;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TelegramPanel({ projects = [] }: TelegramPanelProps) {
  const [messages,     setMessages]     = useState<TelegramMessage[]>(INITIAL_MSGS);
  const [input,        setInput]        = useState('');
  const [typing,       setTyping]       = useState(false);
  const [orchestrating, setOrchestrating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { addActivity } = useActivity();

  function pushMsg(msg: TelegramMessage) {
    setMessages(prev => [...prev, msg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function pushMsgs(msgs: TelegramMessage[]) {
    setMessages(prev => [...prev, ...msgs]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || typing || orchestrating) return;
    setInput('');

    // User message
    pushMsg({ id: uid(), role: 'user', text, timestamp: new Date() });

    // Audit log (fire and forget)
    supabase.from('audit_logs').insert({
      action: 'telegram_command', entity_type: 'telegram',
      meta: { command: text },
    });
    addActivity({ type: 'telegram', title: `📲 Telegram: ${text}` });

    const cmd = text.toLowerCase().trim();

    // ── /clear ─────────────────────────────────────────────────────────────
    if (cmd === '/clear') {
      setMessages([]);
      return;
    }

    // ── Sync commands ──────────────────────────────────────────────────────
    const syncReply = handleSyncCommand(cmd, projects);
    if (syncReply) {
      setTyping(true);
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      setTyping(false);
      pushMsg({ id: uid(), role: 'bot', text: syncReply.text, timestamp: new Date(), actions: syncReply.actions });
      return;
    }

    // ── Unknown slash command ──────────────────────────────────────────────
    const isSlash   = text.startsWith('/');
    const isOrchCmd = cmd.startsWith('/orchestrate ') || cmd.startsWith('/task ');
    if (isSlash && !isOrchCmd) {
      pushMsg({
        id: uid(), role: 'bot',
        text: '❓ Unknown command. Type /help to see all commands.',
        timestamp: new Date(),
      });
      return;
    }

    // ── Orchestrate: /orchestrate <task>, /task <task>, or free text ───────
    const task = isOrchCmd
      ? text.slice(text.indexOf(' ') + 1).trim()
      : text;

    if (!task) return;

    // Processing indicator
    setOrchestrating(true);
    pushMsg({
      id:   uid(),
      role: 'bot',
      text: `⚡ <b>Orchestrating…</b>\n\n<i>"${task.slice(0, 100)}${task.length > 100 ? '…' : ''}"</i>\n\nDispatching to relevant agents — this takes ~30s.`,
      timestamp: new Date(),
    });

    try {
      const { data, error } = await supabase.functions.invoke('orchestrate', {
        body: { task },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const resultMsgs = formatOrchResult(data.plan, data.results);
      pushMsgs(resultMsgs);

      addActivity({ type: 'agent', title: `🤖 Orchestrated: ${task.slice(0, 60)}` });
    } catch (err: any) {
      pushMsg({
        id:   uid(),
        role: 'bot',
        text: `❌ <b>Orchestration failed</b>\n\n${err?.message ?? 'Unknown error'}`,
        timestamp: new Date(),
      });
    } finally {
      setOrchestrating(false);
    }
  }

  function handleAction(value: string) {
    const [action, id] = value.split('_');
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const responseText = action === 'approve'
      ? `✅ <b>${project.title}</b> approved.`
      : `❌ <b>${project.title}</b> rejected — marked for review.`;
    pushMsg({ id: uid(), role: 'bot', text: responseText, timestamp: new Date() });
  }

  const busy = typing || orchestrating;

  return (
    <div className="flex flex-col h-full ardeno-panel rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-full bg-chart-2/20 border border-chart-2/30 flex items-center justify-center">
          <Bot className="h-4 w-4 text-chart-2" />
        </div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-semibold">Ardeno OS Agent</p>
          <div className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full ${orchestrating ? 'bg-primary animate-pulse' : 'bg-chart-2 animate-pulse'}`} />
            <span className="text-muted-foreground text-[10px]">
              {orchestrating ? 'Orchestrating…' : 'Online'}
            </span>
          </div>
        </div>
        {orchestrating && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="h-4 w-4 text-primary" />
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-background rounded-br-sm'
                  : 'glass border border-border text-foreground rounded-bl-sm'
              }`}>
                <div
                  className="whitespace-pre-line text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/<b>/g,   '<strong>')
                      .replace(/<\/b>/g, '</strong>')
                      .replace(/<i>/g,   '<em>')
                      .replace(/<\/i>/g, '</em>'),
                  }}
                />

                {msg.actions && (
                  <div className="flex gap-2 mt-2">
                    {msg.actions.map(action => (
                      <button
                        key={action.value}
                        onClick={() => handleAction(action.value)}
                        className="flex-1 rounded-lg py-1 text-[11px] font-medium bg-card-3 border border-border hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 mt-1 justify-end">
                  <span className="text-[9px] opacity-50">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'user' && <CheckCheck className="h-2.5 w-2.5 opacity-60" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing / orchestrating indicator */}
        {busy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="ardeno-panel rounded-xl border border-border px-4 py-3">
              <div className="flex gap-1 items-center">
                {orchestrating && <Zap className="h-3 w-3 text-primary mr-1" />}
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${orchestrating ? 'bg-primary/60' : 'bg-muted-foreground/60'}`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={orchestrating ? 'Orchestrating…' : 'Type /help or send a task…'}
            disabled={busy}
            className="flex-1 rounded-xl bg-card-3 border border-border text-sm text-foreground px-3 py-2 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || busy}
            className="rounded-xl px-3 py-2 bg-primary text-background hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {orchestrating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : typing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
