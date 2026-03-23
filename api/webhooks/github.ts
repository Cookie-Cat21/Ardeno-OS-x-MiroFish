import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    const event = req.headers.get('x-github-event');
    const signature = req.headers.get('x-hub-signature-256');

    // Signature verification logic would go here in production
    // For now, we'll log the audit and process the payload
    
    await supabase.from('audit_logs').insert({
      action: 'github_webhook_received',
      metadata: { event, sender: payload.sender?.login }
    });

    if (event === 'push') {
      const commits = payload.commits || [];
      const repoName = payload.repository.full_name;
      const branch = payload.ref.replace('refs/heads/', '');

      for (const commit of commits) {
        await supabase.from('github_commits').upsert({
          repo_full_name: repoName,
          commit_sha: commit.id,
          author_name: commit.author.name,
          message: commit.message,
          branch: branch,
          url: commit.url
        }, { onConflict: 'repo_full_name,commit_sha' });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GitHub Webhook Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
