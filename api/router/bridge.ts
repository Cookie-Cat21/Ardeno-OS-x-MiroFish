import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export const config = {
  runtime: 'edge',
};

// BUDGET LIMITS
const GROQ_TOKEN_LIMIT = 8_000_000;
const GEMINI_REQUEST_LIMIT = 1_200;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. JWT Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    // 2. Budget Guard Check
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
        .from('budget_usage')
        .select('*')
        .eq('date', today)
        .single();

    if (usage) {
      if (usage.groq_tokens_used >= GROQ_TOKEN_LIMIT || usage.gemini_requests_used >= GEMINI_REQUEST_LIMIT) {
        return new Response(JSON.stringify({ 
          error: 'Daily Budget Exceeded', 
          message: 'The Parallel Society has reached its daily simulation limit. Resets at midnight UTC.' 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
        });
      }
    }

    // 3. Rate Limiting (Simple check)
    // In production, we would use Upstash or Vercel KV here.
    
    // 4. Audit Log
    const payload = await req.json();
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'bridge_request',
      metadata: { target: payload.target || 'mirofish', goal: payload.goal?.substring(0, 100) }
    });

    // 5. Proxy to MiroFish or Backend
    const backendUrl = Deno.env.get('VITE_MIROFISH_URL') || "http://localhost:5001";
    const response = await fetch(`${backendUrl}/api/agency/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bridge Router Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
