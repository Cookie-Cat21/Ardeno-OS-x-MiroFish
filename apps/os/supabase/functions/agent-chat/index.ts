/**
 * Ardeno OS — agent-chat Edge Function  (Iteration 9)
 *
 * Features:
 *  • Streams responses from OpenRouter, Groq, or Gemini
 *  • Injects long-term agent memories into every system prompt
 *  • Extracts new memories after each conversation (via Groq llama-3.1-8b-instant)
 *  • Tracks usage in agent_usage table
 *
 * Required Supabase Secrets (set in Dashboard → Edge Functions → Secrets):
 *   OPENROUTER_API_KEY, GROQ_API_KEY, GEMINI_API_KEY
 *
 * Deploy: supabase functions deploy agent-chat
 */

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

// ─── Memory extraction ────────────────────────────────────────────────────────
async function extractAndStoreMemories(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  agentId:  string,
  messages: Message[],
  response: string,
): Promise<void> {
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey || response.length < 80) return;

  const convo = messages
    .slice(-6)
    .map(m => `${m.role}: ${m.content.slice(0, 400)}`)
    .join('\n');

  const prompt = `You extract memorable facts from AI assistant conversations for long-term storage.

Review this conversation and extract 1-4 facts worth remembering permanently.
Only extract facts that are genuinely re-usable (client budgets, preferences, decisions, deadlines, names, repeating patterns).
Skip trivial exchanges, greetings, or one-off questions.

Return ONLY a valid JSON array — no markdown, no explanation:
[{"content":"fact text","memory_type":"client_fact|preference|project_context|summary","importance":1-10}]

Conversation:
${convo}
assistant: ${response.slice(0, 600)}`;

  try {
    const res  = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'llama-3.1-8b-instant',
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  400,
        temperature: 0.1,
      }),
    });

    const data  = await res.json();
    const raw   = (data.choices?.[0]?.message?.content as string) ?? '';
    const clean = raw.replace(/```(?:json)?\n?/g, '').replace(/\n?```/g, '').trim();
    const facts = JSON.parse(clean);

    if (!Array.isArray(facts)) return;

    const VALID_TYPES = ['client_fact', 'preference', 'project_context', 'summary'];

    for (const fact of facts) {
      if (!fact?.content) continue;
      await supabase.from('agent_memory').insert({
        agent_id:    agentId,
        content:     String(fact.content).slice(0, 500),
        memory_type: VALID_TYPES.includes(fact.memory_type) ? fact.memory_type : 'client_fact',
        importance:  Math.min(10, Math.max(1, Number(fact.importance) || 5)),
      });
    }
  } catch (_) {
    // Memory extraction is non-critical — never break the main flow
  }
}

// ─── OpenRouter / Groq streaming (OpenAI-compatible format) ──────────────────
async function streamOpenAICompatible(
  url:          string,
  apiKey:       string,
  model:        string,
  systemPrompt: string,
  messages:     Message[],
  extraHeaders: Record<string, string>,
  onChunk:      (text: string) => void,
  controller:   ReadableStreamDefaultController,
  enc:          TextEncoder,
): Promise<void> {
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream:    true,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
  }
  if (!res.body) throw new Error('No response body from API');

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).replace(/\r$/, '').trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') return;
      try {
        const parsed = JSON.parse(json);
        const chunk: string | undefined = parsed.choices?.[0]?.delta?.content;
        if (chunk) {
          onChunk(chunk);
          controller.enqueue(enc.encode(`data: ${json}\n\n`));
        }
      } catch { /* ignore malformed SSE chunk */ }
    }
  }
}

// ─── Gemini streaming ─────────────────────────────────────────────────────────
async function streamGemini(
  apiKey:       string,
  model:        string,
  systemPrompt: string,
  messages:     Message[],
  onChunk:      (text: string) => void,
  controller:   ReadableStreamDefaultController,
  enc:          TextEncoder,
): Promise<void> {
  const contents = messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig:  { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }
  if (!res.body) throw new Error('No Gemini response body');

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).replace(/\r$/, '').trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      try {
        const parsed = JSON.parse(json);
        const chunk: string | undefined = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) {
          onChunk(chunk);
          // Transform to OpenAI SSE format so the client parser stays universal
          const transformed = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
          controller.enqueue(enc.encode(`data: ${transformed}\n\n`));
        }
      } catch { /* ignore */ }
    }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      agent_id       = 'unknown',
      messages       = [] as Message[],
      conversation_id,
      provider       = 'gemini',
      model,
      system_prompt,
    } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── 1. Resolve system prompt ─────────────────────────────────────────────
    let basePrompt: string = system_prompt ?? '';
    if (!basePrompt) {
      // Fallback: look up in custom_agents table
      const { data: ca } = await supabase
        .from('custom_agents')
        .select('system_prompt')
        .eq('agent_id', agent_id)
        .single();
      basePrompt = ca?.system_prompt
        ?? `You are ${agent_id}, a specialist AI assistant for Ardeno Studio, a premium web design agency in Sri Lanka. Be professional, precise, and helpful.`;
    }

    // ── 2. Fetch top memories for this agent ─────────────────────────────────
    const { data: memories } = await supabase
      .from('agent_memory')
      .select('content, memory_type, importance')
      .eq('agent_id', agent_id)
      .order('importance', { ascending: false })
      .order('last_accessed',  { ascending: false })
      .limit(10);

    let finalSystemPrompt = basePrompt;
    if (memories && memories.length > 0) {
      const memBlock = (memories as { content: string }[])
        .map(m => `- ${m.content}`)
        .join('\n');
      finalSystemPrompt += `\n\n[WORKSPACE MEMORY — context from past sessions]\n${memBlock}`;

      // Mark memories as recently accessed
      await supabase
        .from('agent_memory')
        .update({ last_accessed: new Date().toISOString() })
        .eq('agent_id', agent_id);
    }

    // ── 3. Resolve provider + model ──────────────────────────────────────────
    const resolvedProvider = (provider as string) || 'gemini';
    const resolvedModel    = (model as string) || (
      resolvedProvider === 'groq'       ? 'llama-3.1-8b-instant'        :
      resolvedProvider === 'openrouter' ? 'deepseek/deepseek-r1:free'   :
                                          'gemini-2.0-flash'
    );

    // ── 4. Build + return streaming response ─────────────────────────────────
    const enc       = new TextEncoder();
    let   fullText  = '';
    const startTime = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const onChunk = (text: string) => { fullText += text; };

          if (resolvedProvider === 'gemini') {
            await streamGemini(
              Deno.env.get('GEMINI_API_KEY')!,
              resolvedModel, finalSystemPrompt, messages,
              onChunk, controller, enc,
            );
          } else if (resolvedProvider === 'groq') {
            await streamOpenAICompatible(
              'https://api.groq.com/openai/v1/chat/completions',
              Deno.env.get('GROQ_API_KEY')!,
              resolvedModel, finalSystemPrompt, messages, {},
              onChunk, controller, enc,
            );
          } else {
            // openrouter (default)
            await streamOpenAICompatible(
              'https://openrouter.ai/api/v1/chat/completions',
              Deno.env.get('OPENROUTER_API_KEY')!,
              resolvedModel, finalSystemPrompt, messages,
              { 'HTTP-Referer': 'https://ardeno.studio', 'X-Title': 'Ardeno OS' },
              onChunk, controller, enc,
            );
          }

          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();

          // ── 5. Post-stream: track usage ──────────────────────────────────
          const responseMs = Date.now() - startTime;
          await supabase.from('agent_usage').insert({
            agent_id,
            agent_name:       agent_id,
            provider:         resolvedProvider,
            model:            resolvedModel,
            input_tokens:     Math.ceil(
              messages.reduce((s: number, m: Message) => s + m.content.length, 0) / 4
            ),
            output_tokens:    Math.ceil(fullText.length / 4),
            response_time_ms: responseMs,
            estimated_cost:   0,
          });

          // ── 6. Post-stream: extract + store memories ─────────────────────
          // Runs after controller is closed — non-blocking for the client
          await extractAndStoreMemories(supabase, agent_id, messages, fullText);

        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bad request';
    return new Response(JSON.stringify({ error: msg }), {
      status:  400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
