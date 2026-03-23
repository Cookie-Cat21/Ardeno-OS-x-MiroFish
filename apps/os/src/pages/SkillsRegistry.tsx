import { useState } from 'react';
import { Plus, Search, RefreshCw, Brain } from 'lucide-react';
import { useSkills } from '@/hooks/useSkills';
import { AddSkillForm } from '@/components/skills/AddSkillForm';
import { Skill, SKILL_CATEGORIES } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Frontend:     'bg-blue-400/10 text-blue-400',
  Backend:      'bg-green-400/10 text-green-400',
  Security:     'bg-red-400/10 text-red-400',
  Localization: 'bg-yellow-400/10 text-yellow-400',
  DevOps:       'bg-purple-400/10 text-purple-400',
  Design:       'bg-pink-400/10 text-pink-400',
  General:      'bg-muted/10 text-muted-foreground',
};

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <div className="ardeno-panel rounded-xl p-4 border border-border hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-foreground text-sm font-semibold truncate">{skill.name}</h3>
            <span className={cn('shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded', CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.General)}>
              {skill.category}
            </span>
          </div>
          {skill.description && (
            <p className="text-muted-foreground text-[11px] truncate">{skill.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-right">
          <div>
            <p className="text-primary text-sm font-bold">{skill.success_rate}%</p>
            <p className="text-muted-foreground text-[10px]">success</p>
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">{skill.usage_count}</p>
            <p className="text-muted-foreground text-[10px]">uses</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-mono">{skill.version}</p>
            <p className="text-muted-foreground text-[10px]">{formatRelativeTime(skill.last_updated)}</p>
          </div>
        </div>
      </div>

      {/* Success rate bar */}
      <div className="mt-3 h-1 rounded-full bg-card-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-500"
          style={{ width: `${skill.success_rate}%` }}
        />
      </div>
    </div>
  );
}

export default function SkillsRegistryPage() {
  const { data: skills = [], isLoading } = useSkills();

  const [showForm,  setShowForm]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState<string>('All');

  const filtered = skills.filter(s => {
    const matchSearch   = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || s.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <AddSkillForm open={showForm} onOpenChange={setShowForm} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills…"
            className="w-full rounded-lg bg-card border border-border text-sm text-foreground pl-9 pr-3 py-2 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors"
          />
        </div>

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-lg bg-card border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-primary/50 transition-colors"
        >
          <option value="All">All Categories</option>
          {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-primary text-background font-medium hover:bg-primary/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['Frontend','Security','General'] as const).map(cat => {
          const catSkills = skills.filter(s => s.category === cat);
          const avg = catSkills.length
            ? Math.round(catSkills.reduce((s, sk) => s + sk.success_rate, 0) / catSkills.length)
            : 0;
          return (
            <div key={cat} className="ardeno-panel rounded-xl p-3 border border-border text-center">
              <Brain className={cn('h-4 w-4 mx-auto mb-1', CATEGORY_COLORS[cat]?.split(' ')[1] ?? 'text-muted-foreground')} />
              <p className="text-foreground text-lg font-bold font-display">{catSkills.length}</p>
              <p className="text-muted-foreground text-[10px]">{cat} · {avg}% avg</p>
            </div>
          );
        })}
      </div>

      {/* Skills list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ardeno-panel rounded-xl p-10 text-center border border-border">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No skills found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(skill => <SkillRow key={skill.id} skill={skill} />)}
        </div>
      )}
    </div>
  );
}
