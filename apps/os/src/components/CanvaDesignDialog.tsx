// ============================================================
// Ardeno OS – Canva Design Dialog
//
// SECURITY NOTE: The Canva access token (VITE_CANVA_ACCESS_TOKEN)
// is an OAuth 2.0 bearer token. Because this is a Vite app, the
// token is exposed in the browser bundle. For production, route
// all Canva API calls through a Supabase Edge Function or your
// own backend proxy — never commit the token to version control.
//
// Canva Connect REST API reference:
//   https://www.canva.com/developers/docs/connect/
//
// Scopes required:
//   design:read  design:write  export:write
//
// Template IDs below are placeholders — replace with real
// template IDs from your Canva Pro account.
// ============================================================

import { useState } from 'react';
import { X, Palette, Download, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Project } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { useActivity } from '@/context/ActivityContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Template options ─────────────────────────────────────────
interface TemplateOption {
  id:       string; // Canva template/brand_template ID (replace with real IDs)
  label:    string;
  emoji:    string;
  style:    string;
  colorHex: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id:       'DAFY3m_mEtI', // placeholder — replace with your Canva template ID
    label:    'Minimalist',
    emoji:    '◻️',
    style:    'Clean lines, muted palette, sans-serif',
    colorHex: '#F8F9FA',
  },
  {
    id:       'DAFVZr8AyNs', // placeholder
    label:    'Luxury',
    emoji:    '✦',
    style:    'Gold accents, serif typography, dark background',
    colorHex: '#D4AF37',
  },
  {
    id:       'DAGBkq_7wgY', // placeholder
    label:    'E-commerce',
    emoji:    '🛒',
    style:    'Bold product shots, vibrant CTA colours',
    colorHex: '#00A896',
  },
  {
    id:       'DAFHx9q1Z2c', // placeholder
    label:    'Corporate',
    emoji:    '🏢',
    style:    'Professional blues, data-driven layout',
    colorHex: '#3B82F6',
  },
];

// ─── Canva API helpers ─────────────────────────────────────────
const CANVA_API = 'https://api.canva.com/rest/v1';

// Read token from env — never hardcode
const CANVA_TOKEN = import.meta.env.VITE_CANVA_ACCESS_TOKEN as string | undefined;

interface CanvaDesignResult {
  designId:  string;
  editUrl:   string;
  exportUrl: string | null; // may be null if export takes time
}

/** Create a new Canva design from a template */
async function createCanvaDesign(
  templateId: string,
  title:      string,
): Promise<CanvaDesignResult> {
  if (!CANVA_TOKEN) {
    throw new Error('VITE_CANVA_ACCESS_TOKEN is not set. Add it to your .env file.');
  }

  // Step 1: Create design from template
  const createRes = await fetch(`${CANVA_API}/designs`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${CANVA_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      design_type: { type: 'presentation' }, // adjust to your template type
      asset_id: templateId,                  // template asset ID
      title,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    const code = (err as { error?: { code?: string } })?.error?.code ?? createRes.status;
    if (createRes.status === 401) {
      throw new Error('CANVA_TOKEN_EXPIRED');
    }
    throw new Error(`Canva API error ${code}: ${JSON.stringify(err)}`);
  }

  const created = await createRes.json() as {
    design: { id: string; urls: { edit_url: string } }
  };

  const designId = created.design.id;
  const editUrl  = created.design.urls.edit_url;

  // Step 2: Request export (async — Canva may return job ID)
  const exportRes = await fetch(`${CANVA_API}/exports`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${CANVA_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      design_id: designId,
      format:    'png',
      pages:     [1], // first page only
    }),
  });

  let exportUrl: string | null = null;

  if (exportRes.ok) {
    const exportData = await exportRes.json() as {
      job?: { status: string; urls?: string[] }
      export_url?: string
    };

    // Some Canva API versions return URL directly, others via job polling
    exportUrl =
      exportData.export_url ??
      exportData.job?.urls?.[0] ??
      null;
  }

  return { designId, editUrl, exportUrl };
}

/** Poll for export job completion (simplified — real impl uses job ID) */
async function pollExportJob(jobId: string, maxAttempts = 6): Promise<string | null> {
  if (!CANVA_TOKEN) return null;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000)); // wait 2s between polls

    const res = await fetch(`${CANVA_API}/exports/${jobId}`, {
      headers: { 'Authorization': `Bearer ${CANVA_TOKEN}` },
    });

    if (!res.ok) break;

    const data = await res.json() as { job?: { status: string; urls?: string[] } };
    if (data.job?.status === 'success' && data.job.urls?.[0]) {
      return data.job.urls[0];
    }
    if (data.job?.status === 'failed') break;
  }

  return null;
}

// ─── Component ────────────────────────────────────────────────
interface CanvaDesignDialogProps {
  project: Project;
  onClose: () => void;
}

export function CanvaDesignDialog({ project, onClose }: CanvaDesignDialogProps) {
  const { updateScores } = useProjects();  // reuse update mutation for moodboard_url save
  const { addActivity }  = useActivity();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>(TEMPLATE_OPTIONS[1]); // Default: Luxury
  const [status, setStatus] = useState<'idle' | 'creating' | 'exporting' | 'done' | 'error'>('idle');
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [editUrl,     setEditUrl]     = useState<string | null>(null);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);

  const isTokenMissing = !CANVA_TOKEN;

  async function handleGenerate() {
    if (isTokenMissing) {
      toast.error('Canva token not configured. Check your .env file.');
      return;
    }

    setStatus('creating');
    setErrorMsg(null);
    setPreviewUrl(null);

    const designTitle = `${project.client_name} – ${project.title} [${selectedTemplate.label}]`;

    try {
      const result = await createCanvaDesign(selectedTemplate.id, designTitle);
      setEditUrl(result.editUrl);

      // If export is immediately available
      if (result.exportUrl) {
        setPreviewUrl(result.exportUrl);
        setStatus('done');
        await saveToSupabase(result.exportUrl);
      } else {
        // Attempt polling (simplified)
        setStatus('exporting');
        const polled = await pollExportJob(result.designId);
        if (polled) {
          setPreviewUrl(polled);
          await saveToSupabase(polled);
        }
        setStatus('done');
      }

      toast.success('Moodboard created in Canva!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg === 'CANVA_TOKEN_EXPIRED') {
        setErrorMsg('Your Canva access token has expired. Please re-authenticate in Settings.');
        toast.error('Canva token expired', {
          action: { label: 'Settings', onClick: () => window.location.href = '/settings' },
        });
      } else {
        setErrorMsg(msg);
        toast.error(`Canva error: ${msg}`);
      }
      setStatus('error');
    }
  }

  async function saveToSupabase(url: string) {
    // Update moodboard_url on the project row
    const { error } = await supabase
      .from('projects')
      .update({ moodboard_url: url })
      .eq('id', project.id);

    if (error) {
      console.error('[Ardeno OS] Failed to save moodboard_url:', error);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action:      'moodboard_generated',
      entity_type: 'project',
      entity_id:   project.id,
      meta:        { template: selectedTemplate.label, url },
    });

    addActivity({
      type:        'system',
      title:       `🎨 Moodboard generated — ${project.title}`,
      description: `Template: ${selectedTemplate.label}`,
      projectId:   project.id,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md ardeno-panel rounded-2xl border border-border shadow-xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="text-foreground font-semibold font-display">Generate Moodboard</h3>
                <p className="text-muted-foreground text-xs">{project.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Token warning */}
            {isTokenMissing && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 p-3 text-xs text-yellow-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-0.5">Canva token not configured</p>
                  <p className="text-yellow-400/70">
                    Add <code className="bg-yellow-400/20 px-1 rounded">VITE_CANVA_ACCESS_TOKEN</code> to your{' '}
                    <code className="bg-yellow-400/20 px-1 rounded">.env</code> file.
                    Get a token from the{' '}
                    <a
                      href="https://www.canva.com/developers/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Canva Developer Portal
                    </a>.
                  </p>
                </div>
              </div>
            )}

            {/* Template selector */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs uppercase tracking-widest">Select Style</p>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_OPTIONS.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={cn(
                      'flex items-start gap-2 rounded-lg p-3 border text-left transition-all',
                      selectedTemplate.id === tpl.id
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border hover:border-border/80 bg-card-3'
                    )}
                  >
                    <span className="text-lg leading-none mt-0.5">{tpl.emoji}</span>
                    <div>
                      <p className="text-foreground text-xs font-semibold">{tpl.label}</p>
                      <p className="text-muted-foreground text-[10px] leading-snug mt-0.5">{tpl.style}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <AnimatePresence>
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">Preview</p>
                  <div className="relative rounded-lg overflow-hidden border border-primary/20 group">
                    <img
                      src={previewUrl}
                      alt="Moodboard preview"
                      className="w-full object-contain max-h-48"
                    />
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={previewUrl}
                      download={`moodboard-${project.title}.png`}
                      className="flex items-center gap-1.5 flex-1 justify-center rounded-lg py-2 text-xs bg-card-3 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PNG
                    </a>
                    {editUrl && (
                      <a
                        href={editUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 flex-1 justify-center rounded-lg py-2 text-xs bg-purple-400/10 border border-purple-400/20 text-purple-300 hover:bg-purple-400/20 transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Edit in Canva
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={status === 'creating' || status === 'exporting' || isTokenMissing}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white transition-all disabled:opacity-50"
            >
              {status === 'creating' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'exporting' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'creating'  && 'Creating design…'}
              {status === 'exporting' && 'Exporting image…'}
              {(status === 'idle' || status === 'error') && (
                <><Palette className="h-4 w-4" /> Generate {selectedTemplate.label} Moodboard</>
              )}
              {status === 'done' && <><Palette className="h-4 w-4" /> Regenerate</>}
            </button>

            <p className="text-muted-foreground text-[10px] text-center">
              Creates a live Canva design · saved to your Pro workspace
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
