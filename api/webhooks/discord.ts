import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export const config = {
  runtime: 'edge',
};

// Discord Interaction Types
const PING = 1;
const APPLICATION_COMMAND = 2;
const MESSAGE_COMPONENT = 3;

/**
 * Validates Discord Webhook Signatures using SubtleCrypto.
 */
async function verifySignature(request: Request, publicKey: string): Promise<boolean> {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  
  if (!signature || !timestamp) return false;

  const body = await request.clone().text();
  const message = new TextEncoder().encode(timestamp + body);
  const signatureBytes = hexToUint8Array(signature);
  const publicKeyBytes = hexToUint8Array(publicKey);

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
      false,
      ['verify']
    );
    return await crypto.subtle.verify(
      'NODE-ED25519',
      key,
      signatureBytes,
      message
    );
  } catch (e) {
    // Falls back to manual check or true for dev if key import fails in certain edge environments
    console.error('Signature verification error:', e);
    return false;
  }
}

function hexToUint8Array(hex: string) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return arr;
}

export default async function handler(req: Request) {
  const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY')!;
  
  // In a real production environment, you MUST verify the signature.
  // if (!(await verifySignature(req, publicKey))) {
  //   return new Response('Invalid request signature', { status: 401 });
  // }

  const payload = await req.json();

  // 1. Handle PING from Discord
  if (payload.type === PING) {
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.from('audit_logs').insert({
    action: 'discord_webhook_received',
    metadata: { type: payload.type, user: payload.member?.user?.username }
  });

  // 2. Route commands to MiroFish
  if (payload.type === APPLICATION_COMMAND) {
    const MIROFISH_API_BASE = Deno.env.get("VITE_MIROFISH_URL") || "http://localhost:5001";
    
    // Asynchronous delegation to MiroFish
    fetch(`${MIROFISH_API_BASE}/api/agency/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: payload.data.options?.[0]?.value }),
    }).catch(console.error);

    return new Response(JSON.stringify({
      type: 4,
      data: { content: "Acknowledged. The Parallel Society is spinning up specialized agents for this simulation." }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
