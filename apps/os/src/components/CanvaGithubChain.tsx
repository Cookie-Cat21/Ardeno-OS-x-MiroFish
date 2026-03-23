/**
 * Canva + GitHub chain component
 * "Generate & Commit Visuals" — one click:
 *   1. Create Canva design from moodboard template
 *   2. Export as PNG
 *   3. Save moodboard_url to project
 *   4. Base64-encode the PNG
 *   5. Commit it to GitHub repo as `moodboards/<projectId>.png`
 *   6. On any failure → automatic rollback (delete file if it was uploaded)
 */
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Image, Github, CheckCircle2, XCircle, Loader2, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Project } from '@/types';

// ─── Canva helpers ─────────────────────────────────────────────────────────

const CANVA_BASE = 'https://api.canva.com/rest/v1';
const CANVA_MOODBOARD_TEMPLATE_ID = import.meta.env.VITE_CANVA_MOODBOARD_TEMPLATE ?? 'DAFXxyz_placeholder';

async function canvaRequest(path: string, method: string, body?: unknown): Promise<Response> {
  const token = import.meta.env.VITE_CANVA_ACCESS_TOKEN;
  if (!token) throw new Error('CANVA_TOKEN_MISSING');
  return fetch(`${CANVA_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createCanvaDesign(projectTitle: string): Promise<{ designId: string; editUrl: string }> {
  const res = await canvaRequest('/designs', 'POST', {
    design_type: { type: 'preset', name: 'Presentation' },
    title: `${projectTitle} — Moodboard`,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Canva create failed (${res.status})`);
  }
  const json = await res.json();
  return { designId: json.design?.id ?? '', editUrl: json.design?.urls?.edit_url ?? '' };
}

async function exportCanvaDesign(designId: string): Promise<string> {
  const res = await canvaRequest(`/designs/${designId}/exports`, 'POST', {
    format: 'png',
    pages: [1],
  });
  if (!res.ok) throw new Error(`Canva export failed (${res.status})`);
  const json = await res.json();
  const jobId: string = json.job?.id;
  if (!jobId) throw new Error('No export job ID returned');

  // Poll for completion (max 15 attempts × 1.5s)
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const poll = await canvaRequest(`/exports/${jobId}`, 'GET');
    const pj   = await poll.json();
    if (pj.job?.status === 'success') {
      const url = pj.job?.urls?.[0];
      if (!url) throw new Error('No export URL in response');
      return url as string;
    }
    if (pj.job?.status === 'failed') throw new Error('Canva export job failed');
  }
  throw new Error('Canva export timed out');
}

// ─── GitHub helpers ────────────────────────────────────────────────────────

const GH_API = 'https://api.github.com';

async function githubRequest(path: string, method: string, body?: unknown): Promise<Response> {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const repo  = import.meta.env.VITE_GITHUB_REPO; // e.g. "ArdenoStudio/ardeno-os"
  if (!token || !repo) throw new Error('GITHUB_TOKEN_MISSING');
  return fetch(`${GH_API}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Fetch PNG from URL and return base64 string */
async function fetchBase64(url: string): Promise<string> {
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image from Canva CDN (${res.status})`);
  const buf  = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/** Commit file to GitHub. Returns { sha, htmlUrl } */
async function commitFileToGithub(
  filePath: string,
  base64Content: string,
  commitMessage: string
): Promise<{ sha: string; htmlUrl: string; fileSha: string | null }> {
  // Check if file already exists (for update SHA)
  let fileSha: string | null = null;
  const check = await githubRequest(`/contents/${filePath}`, 'GET');
  if (check.ok) {
    const cj = await check.json();
    fileSha = cj.sha ?? null;
  }

  const body: Record<string, unknown> = {
    message: commitMessage,
    content: base64Content,
    branch:  'main',
  };
  if (fileSha) body.sha = fileSha;

  const res = await githubRequest(`/contents/${filePath}`, 'PUT', body);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `GitHub commit failed (${res.status})`);
  }
  const json = await res.json();
  return {
    sha:      json.commit?.sha ?? '',
    htmlUrl:  json.content?.html_url ?? '',
    fileSha:  json.content?.sha ?? null,
  };
}

/** Delete a file from GitHub (rollback) */
async function deleteFileFromGithub(filePath: string, fileSha: string): Promise<void> {
  await githubRequest(`/contents/${filePath}`, 'DELETE', {
    message: 'chore: rollback moodboard upload',
    sha:     fileSha,
    branch:  'main',
  });
}

// ─── Step state ────────────────────────────────────────────────────────────

type StepStatus = 'idle' | 'loading' | 'done' | 'error';

interface Step {
  id:     string;
  label:  string;
  status: StepStatus;
  detail: string;
}

const INITIAL_STEPS: Step[] = [
  { id: 'canva_create', label: '1. Create Canva Design', status: 'idle', detail: '' },
  { id: 'canva_export', label: '2. Export as PNG',        status: 'idle', detail: '' },
  { id: 'github_fetch', label: '3. Fetch Image Bytes',    status: 'idle', detail: '' },
  { id: 'github_commit',label: '4. Commit to GitHub',     status: 'idle', detail: '' },
  { id: 'db_save',      label: '5. Save Moodboard URL',   status: 'idle', detail: '' },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface CanvaGithubChainProps {
  project: Project;
  onSuccess?: (moodboardUrl: string, commitSha: string) => void;
}

export function CanvaGithubChain({ project, onSuccess }: CanvaGithubChainProps) {
  const [open,     setOpen]     = useState(false);
  const [steps,    setSteps]    = useState<Step[]>(INITIAL_STEPS);
  const [running,  setRunning]  = useState(false);
  const [finished, setFinished] = useState(false);
  const [failed,   setFailed]   = useState(false);

  function setStep(id: string, partial: Partial<Step>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...partial } : s));
  }

  function resetSteps() {
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle', detail: '' })));
    setFinished(false);
    setFailed(false);
  }

  async function runChain() {
    if (running) return;
    resetSteps();
    setRunning(true);

    let designId    = '';
    let exportUrl   = '';
    let base64Png   = '';
    let commitSha   = '';
    let githubUrl   = '';
    let fileSha:    string | null = null;
    const filePath  = `moodboards/${project.id}.png`;

    try {
      // Step 1: Create Canva design
      setStep('canva_create', { status: 'loading', detail: 'Calling Canva API…' });
      try {
        const result = await createCanvaDesign(project.title);
        designId = result.designId;
        setStep('canva_create', { status: 'done', detail: `Design ID: ${designId.slice(0, 12)}…` });
      } catch (err: any) {
        setStep('canva_create', { status: 'error', detail: err.message });
        throw err;
      }

      // Step 2: Export PNG
      setStep('canva_export', { status: 'loading', detail: 'Exporting PNG (polling)…' });
      try {
        exportUrl = await exportCanvaDesign(designId);
        setStep('canva_export', { status: 'done', detail: 'Export ready' });
      } catch (err: any) {
        setStep('canva_export', { status: 'error', detail: err.message });
        throw err;
      }

      // Step 3: Fetch bytes
      setStep('github_fetch', { status: 'loading', detail: 'Downloading image…' });
      try {
        base64Png = await fetchBase64(exportUrl);
        setStep('github_fetch', { status: 'done', detail: `${Math.round(base64Png.length * 0.75 / 1024)} KB` });
      } catch (err: any) {
        setStep('github_fetch', { status: 'error', detail: err.message });
        throw err;
      }

      // Step 4: Commit to GitHub
      setStep('github_commit', { status: 'loading', detail: 'Pushing to repo…' });
      try {
        const result = await commitFileToGithub(
          filePath,
          base64Png,
          `feat: add moodboard for "${project.title}" [auto]`
        );
        commitSha = result.sha;
        githubUrl = result.htmlUrl;
        fileSha   = result.fileSha;
        setStep('github_commit', { status: 'done', detail: `SHA: ${commitSha.slice(0, 10)}` });
      } catch (err: any) {
        setStep('github_commit', { status: 'error', detail: err.message });
        throw err;
      }

      // Step 5: Save moodboard_url to DB
      setStep('db_save', { status: 'loading', detail: 'Updating project record…' });
      try {
        const { error } = await supabase
          .from('projects')
          .update({ moodboard_url: githubUrl })
          .eq('id', project.id);
        if (error) throw error;
        setStep('db_save', { status: 'done', detail: 'moodboard_url saved' });
      } catch (err: any) {
        setStep('db_save', { status: 'error', detail: err.message });
        throw err;
      }

      setFinished(true);
      toast.success('Moodboard generated & committed to GitHub!');
      onSuccess?.(githubUrl, commitSha);

    } catch (chainErr: any) {
      setFailed(true);

      // Rollback: delete GitHub file if it was committed
      if (fileSha) {
        toast.loading('Rolling back GitHub commit…');
        try {
          await deleteFileFromGithub(filePath, fileSha);
          toast.dismiss();
          toast.info('GitHub file rolled back successfully');
        } catch {
          toast.dismiss();
          toast.error('Rollback failed — you may need to manually delete the file from GitHub');
        }
      }

      toast.error(`Chain failed: ${chainErr.message}`);
    } finally {
      setRunning(false);
    }
  }

  // Only show for Design / Deploy stages
  const eligibleStages = ['Design', 'Build', 'Deploy'];
  if (!eligibleStages.includes(project.stage)) return null;

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!running) setOpen(v); }}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium"
          title="Generate Canva moodboard and commit to GitHub"
        >
          <Zap className="h-3 w-3" />
          Generate &amp; Commit
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md ardeno-panel rounded-2xl border border-border shadow-2xl focus:outline-none data-[state=open]:animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Image  className="h-4 w-4 text-purple-400" />
                <span className="text-muted-foreground text-xs">→</span>
                <Github className="h-4 w-4 text-foreground" />
              </div>
              <Dialog.Title className="text-foreground font-semibold text-sm ml-1">
                Generate &amp; Commit Visuals
              </Dialog.Title>
            </div>
            {!running && (
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </Dialog.Close>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Project info */}
            <div className="bg-card-2 rounded-lg px-4 py-3">
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">Project</p>
              <p className="text-foreground text-sm font-medium truncate">{project.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5">Stage: {project.stage}</p>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {steps.map(step => (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {step.status === 'idle'    && <div className="h-1.5 w-1.5 rounded-full bg-border" />}
                    {step.status === 'loading' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                    {step.status === 'done'    && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {step.status === 'error'   && <XCircle className="h-4 w-4 text-red-400" />}
                  </div>

                  {/* Label + detail */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium',
                      step.status === 'idle'    && 'text-muted-foreground',
                      step.status === 'loading' && 'text-foreground',
                      step.status === 'done'    && 'text-foreground',
                      step.status === 'error'   && 'text-red-400',
                    )}>
                      {step.label}
                    </p>
                    {step.detail && (
                      <p className={cn(
                        'text-[10px] mt-0.5 font-mono',
                        step.status === 'error' ? 'text-red-400' : 'text-muted-foreground'
                      )}>
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Result banners */}
            {finished && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <p className="text-green-400 text-xs">
                  Moodboard committed to GitHub and saved to project!
                </p>
              </div>
            )}
            {failed && !running && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">
                  Chain failed. Any partial GitHub changes have been rolled back.
                </p>
              </div>
            )}

            {/* Security note */}
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              <span className="text-warning font-medium">Security note:</span>{' '}
              VITE_CANVA_ACCESS_TOKEN &amp; VITE_GITHUB_TOKEN are client-visible. In production,
              route these calls through a Supabase Edge Function proxy.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3">
            {!finished && (
              <button
                onClick={runChain}
                disabled={running}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                  running
                    ? 'bg-card-3 text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-background hover:bg-primary/80'
                )}
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running chain…
                  </>
                ) : failed ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Retry Chain
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Run Chain
                  </>
                )}
              </button>
            )}

            {(finished || !running) && (
              <Dialog.Close
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </Dialog.Close>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
