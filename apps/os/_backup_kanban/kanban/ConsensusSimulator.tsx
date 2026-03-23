import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, AlertTriangle, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '@/types';
import { generateAgentScores, scoreNeedsReview } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useSkills } from '@/hooks/useSkills';
import { useActivity } from '@/context/ActivityContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type StepStatus = 'wait' | 'active' | 'done';

interface Step {
  id:      string;
  label:   string;
  ms:      number;
  status:  StepStatus;
}

interface ConsensusSimulatorProps {
  project:  Project;
  onClose:  () => void;
}

const INITIAL_STEPS: Omit<Step, 'status'>[] = [
  { id: 'init',     label: 'Initialising agent context…',        ms: 1200 },
  { id: 'analyse',  label: 'Analysing project data…',            ms: 1600 },
  { id: 'vote',     label: 'Collecting agent votes…',            ms: 1800 },
  { id: 'finalise', label: 'Calculating consensus & risk…',      ms: 1000 },
];

export function ConsensusSimulator({ project, onClose }: ConsensusSimulatorProps) {
  const { updateScores }   = useProjects();
  const { bumpRandomSkills } = useSkills();
  const { addActivity }    = useActivity();

  const [steps, setSteps]   = useState<Step[]>(
    INITIAL_STEPS.map(s => ({ ...s, status: 'wait' }))
  );
  const [result, setResult] = useState<{ consensus: number; risk: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [applied, setApplied] = useState(false);
  const timerRefs = useRef<number[]>([]);

  function setStepStatus(id: string, status: StepStatus) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }

  function startSimulation() {
    setRunning(true);
    setResult(null);
    setApplied(false);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'wait' })));

    let elapsed = 0;
    INITIAL_STEPS.forEach((step, i) => {
      const startT = elapsed;
      elapsed += step.ms;

      const t1 = window.setTimeout(() => setStepStatus(step.id, 'active'), startT);
      const t2 = window.setTimeout(() => {
        setStepStatus(step.id, 'done');
        if (i === INITIAL_STEPS.length - 1) {
          const scores = generateAgentScores(project.stage);
          setResult(scores);
          setRunning(false);
          // Bump random skill usage counters
          bumpRandomSkills(2);
        }
      }, elapsed);

      timerRefs.current.push(t1, t2);
    });
  }

  // Auto-start
  useEffect(() => {
    startSimulation();
    return () => timerRefs.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyResult() {
    if (!result) return;
    setApplied(true);

    updateScores.mutate({
      id:              project.id,
      consensus_score: result.consensus,
      risk_score:      result.risk,
    });

    // Write agent_reviews rows
    const agents = [
      { name: 'Frontend Agent', weight: 1.0 },
      { name: 'Security Agent', weight: 1.5 },
      { name: 'Lead Dev Agent', weight: 2.0 },
    ];
    await supabase.from('agent_reviews').insert(
      agents.map(a => ({
        project_id: project.id,
        agent_name: a.name,
        score:      Math.min(98, Math.max(30, result.consensus + Math.round((Math.random() - 0.5) * 20))),
        weight:     a.weight,
        notes:      `Mock review by ${a.name} for stage ${project.stage}`,
      }))
    );

    addActivity({
      type:      'review',
      title:     `🤖 Review applied — ${project.title}`,
      description: `Consensus: ${result.consensus}% · Risk: ${result.risk}%`,
      projectId: project.id,
    });

    if (scoreNeedsReview(result.consensus, result.risk)) {
      toast.warning(
        `⚠️ Low consensus or high risk detected for "${project.title}"`,
        { duration: 5000 }
      );
    } else {
      toast.success(`Review applied to "${project.title}"`);
    }

    onClose();
  }

  return (
    <div className="space-y-5">
      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.id} className="flex items-center gap-3 text-sm">
            {/* Icon */}
            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
              {step.status === 'done'   && <Check className="h-4 w-4 text-os-teal" />}
              {step.status === 'active' && <Loader2 className="h-4 w-4 text-os-gold animate-spin" />}
              {step.status === 'wait'   && <div className="h-2 w-2 rounded-full bg-os-border" />}
            </div>
            <span className={
              step.status === 'done'   ? 'text-os-teal'
            : step.status === 'active' ? 'text-os-text'
            :                            'text-os-muted'
            }>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3 text-center border border-os-gold/20">
                <p className="text-os-muted text-[10px] uppercase tracking-widest mb-1">Consensus</p>
                <p className="text-os-gold text-2xl font-bold font-display">{result.consensus}%</p>
              </div>
              <div className="glass rounded-lg p-3 text-center border border-os-border">
                <p className="text-os-muted text-[10px] uppercase tracking-widest mb-1">Risk</p>
                <p className={`text-2xl font-bold font-display ${
                  result.risk < 40 ? 'text-green-400' : result.risk <= 70 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {result.risk}%
                </p>
              </div>
            </div>

            {/* Warning */}
            {scoreNeedsReview(result.consensus, result.risk) && (
              <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-400/10 rounded-lg p-3 border border-yellow-400/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>Scores indicate this project needs attention before proceeding.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => startSimulation()}
                disabled={running}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-os-muted border border-os-border hover:border-os-gold/30 hover:text-os-text transition-all disabled:opacity-50"
              >
                <Bot className="h-4 w-4" />
                Re-run
              </button>
              <button
                onClick={applyResult}
                disabled={applied}
                className="flex-1 rounded-lg py-2 text-sm font-medium bg-os-gold text-os-bg hover:bg-os-gold-dim transition-colors disabled:opacity-50"
              >
                {applied ? 'Applied ✓' : 'Apply Results'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
