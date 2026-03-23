export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.length - 2]; // Assuming /api/projects/[id]/deploy-status

  const vercelToken = Deno.env.get('VERCEL_TOKEN');
  const vercelProjectId = Deno.env.get(`VERCEL_PROJECT_ID_${projectId.toUpperCase()}`) || Deno.env.get('VERCEL_PROJECT_ID');

  if (!vercelToken || !vercelProjectId) {
    return new Response(JSON.stringify({ 
      status: 'ready', 
      previewUrl: 'https://preview-staging.ardeno.so',
      productionUrl: 'https://ardeno.so',
      lastDeploy: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/deployments?limit=1`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    const data = await response.json();
    const latest = data.deployments?.[0];

    return new Response(JSON.stringify({
      status: latest?.readyState?.toLowerCase() || 'ready',
      previewUrl: latest ? `https://${latest.url}` : null,
      productionUrl: Deno.env.get('PRODUCTION_URL'),
      lastDeploy: latest?.createdAt ? new Date(latest.createdAt).toISOString() : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch deploy status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
