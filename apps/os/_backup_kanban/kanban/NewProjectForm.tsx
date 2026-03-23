import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, CalendarIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { STAGE_ORDER, ProjectStage } from '@/types';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const schema = z.object({
  client_name:   z.string().min(2, 'Client name required'),
  title:         z.string().min(3, 'Project title required'),
  description:   z.string().optional(),
  stage:         z.enum(STAGE_ORDER as [ProjectStage, ...ProjectStage[]]),
  budget:        z.coerce.number().min(0).optional(),
  deadline:      z.string().optional(),
  github_branch: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface NewProjectFormProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectForm({ open, onOpenChange }: NewProjectFormProps) {
  const { createProject } = useProjects();
  const { t }             = useI18n();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stage: 'Intake' },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await createProject.mutateAsync({
        client_name:   data.client_name,
        title:         data.title,
        description:   data.description,
        stage:         data.stage,
        budget:        data.budget,
        deadline:      data.deadline,
        github_branch: data.github_branch,
      });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg glass rounded-2xl border border-os-border shadow-xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-os-border">
            <div>
              <h2 className="text-os-text font-semibold font-display">{t('newProject')}</h2>
              <p className="text-os-muted text-xs mt-0.5">Add to the pipeline</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-os-muted hover:text-os-text hover:bg-os-surface-3 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="text-os-muted text-xs">Client Name *</label>
                <input
                  {...register('client_name')}
                  placeholder="Ardeno Studio"
                  className={cn(
                    'w-full rounded-lg bg-os-surface-3 border text-sm text-os-text px-3 py-2 outline-none',
                    'placeholder:text-os-muted/50 focus:border-os-gold/50 transition-colors',
                    errors.client_name ? 'border-red-400/60' : 'border-os-border'
                  )}
                />
                {errors.client_name && (
                  <p className="text-red-400 text-[10px]">{errors.client_name.message}</p>
                )}
              </div>

              {/* Stage */}
              <div className="space-y-1.5">
                <label className="text-os-muted text-xs">Stage</label>
                <select
                  {...register('stage')}
                  className="w-full rounded-lg bg-os-surface-3 border border-os-border text-sm text-os-text px-3 py-2 outline-none focus:border-os-gold/50 transition-colors"
                >
                  {STAGE_ORDER.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-os-muted text-xs">Project Title *</label>
              <input
                {...register('title')}
                placeholder="Luxe Lanka E-commerce Rebuild"
                className={cn(
                  'w-full rounded-lg bg-os-surface-3 border text-sm text-os-text px-3 py-2 outline-none',
                  'placeholder:text-os-muted/50 focus:border-os-gold/50 transition-colors',
                  errors.title ? 'border-red-400/60' : 'border-os-border'
                )}
              />
              {errors.title && (
                <p className="text-red-400 text-[10px]">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-os-muted text-xs">Description</label>
              <textarea
                {...register('description')}
                placeholder="Brief project overview…"
                rows={2}
                className="w-full rounded-lg bg-os-surface-3 border border-os-border text-sm text-os-text px-3 py-2 outline-none placeholder:text-os-muted/50 focus:border-os-gold/50 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Budget */}
              <div className="space-y-1.5">
                <label className="text-os-muted text-xs">Budget (USD)</label>
                <input
                  {...register('budget')}
                  type="number"
                  placeholder="5000"
                  className="w-full rounded-lg bg-os-surface-3 border border-os-border text-sm text-os-text px-3 py-2 outline-none placeholder:text-os-muted/50 focus:border-os-gold/50 transition-colors"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-os-muted text-xs">Deadline</label>
                <div className="relative">
                  <input
                    {...register('deadline')}
                    type="date"
                    className="w-full rounded-lg bg-os-surface-3 border border-os-border text-sm text-os-text px-3 py-2 pr-8 outline-none focus:border-os-gold/50 transition-colors"
                  />
                  <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-os-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* GitHub Branch */}
            <div className="space-y-1.5">
              <label className="text-os-muted text-xs">GitHub Branch</label>
              <input
                {...register('github_branch')}
                placeholder="feature/project-init"
                className="w-full rounded-lg bg-os-surface-3 border border-os-border text-sm text-os-text px-3 py-2 outline-none placeholder:text-os-muted/50 focus:border-os-gold/50 transition-colors font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { reset(); onOpenChange(false); }}
                className="flex-1 rounded-lg py-2.5 text-sm text-os-muted border border-os-border hover:border-os-gold/30 hover:text-os-text transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-os-gold text-os-bg hover:bg-os-gold-dim transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <span className="h-4 w-4 border-2 border-os-bg/30 border-t-os-bg rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t('createProject')}
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
