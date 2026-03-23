import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkills } from '@/hooks/useSkills';
import { SKILL_CATEGORIES } from '@/types';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const schema = z.object({
  name:         z.string().min(2, 'Name required'),
  description:  z.string().optional(),
  category:     z.enum(SKILL_CATEGORIES as [string, ...string[]]),
  success_rate: z.coerce.number().min(0).max(100),
  version:      z.string().min(1, 'Version required'),
});

type FormData = z.infer<typeof schema>;

interface AddSkillFormProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSkillForm({ open, onOpenChange }: AddSkillFormProps) {
  const { createSkill } = useSkills();
  const { t }           = useI18n();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'General', success_rate: 85, version: 'v1.0' },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await createSkill.mutateAsync({
        name:         data.name,
        description:  data.description,
        category:     data.category as string,
        success_rate: data.success_rate,
        version:      data.version,
      });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative z-10 w-full max-w-md ardeno-panel rounded-2xl border border-border shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-foreground font-semibold font-display">{t('addSkill')}</h2>
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">Skill Name *</label>
              <input
                {...register('name')}
                placeholder="Responsive Grid Builder"
                className={cn(
                  'w-full rounded-lg bg-card-3 border text-sm text-foreground px-3 py-2 outline-none',
                  'placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors',
                  errors.name ? 'border-red-400/60' : 'border-border'
                )}
              />
              {errors.name && <p className="text-red-400 text-[10px]">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs">{t('category')}</label>
                <select
                  {...register('category')}
                  className="w-full rounded-lg bg-card-3 border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-primary/50 transition-colors"
                >
                  {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs">{t('version')}</label>
                <input
                  {...register('version')}
                  placeholder="v1.0"
                  className="w-full rounded-lg bg-card-3 border border-border text-sm text-foreground px-3 py-2 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">{t('successRate')} (%)</label>
              <input
                {...register('success_rate')}
                type="number" min="0" max="100"
                className="w-full rounded-lg bg-card-3 border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">{t('description')}</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Brief description of what this skill does…"
                className="w-full rounded-lg bg-card-3 border border-border text-sm text-foreground px-3 py-2 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { reset(); onOpenChange(false); }}
                className="flex-1 rounded-lg py-2.5 text-sm text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-primary text-background hover:bg-primary/80 transition-colors disabled:opacity-60"
              >
                {submitting
                  ? <span className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  : <Plus className="h-4 w-4" />
                }
                {t('addSkill')}
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
