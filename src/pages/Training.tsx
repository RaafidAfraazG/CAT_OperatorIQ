import { useState, useEffect } from 'react';
import { GraduationCap, Clock, CheckCircle2, Play, BookOpen, ChevronRight, Award } from 'lucide-react';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import {
  mockTrainingModules,
  getRecommendedModules,
  trainingProgress as mockTrainingProgress,
} from '../data/mockTraining';
import type { TrainingModule, TrainingCategory, TrainingDifficulty } from '../types';
import { api } from '../api/client';

const categoryColor: Record<TrainingCategory, string> = {
  safety:     'text-status-safe',
  efficiency: 'text-brand-400',
  fuel:       'text-status-warn',
  operation:  'text-status-info',
  compliance: 'text-surface-300',
};

const difficultyBadge: Record<TrainingDifficulty, { label: string; status: 'safe' | 'warning' | 'neutral' | 'critical' }> = {
  beginner:     { label: 'Beginner',     status: 'safe'    },
  intermediate: { label: 'Intermediate', status: 'warning' },
  advanced:     { label: 'Advanced',     status: 'critical'},
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'not-started': { label: 'Not Started', icon: BookOpen,      color: 'text-surface-400' },
  'in-progress': { label: 'In Progress', icon: Play,          color: 'text-status-info' },
  'completed':   { label: 'Completed',   icon: CheckCircle2,  color: 'text-status-safe' },
};

// ─── Training Preview Modal ────────────────────────────────

function TrainingPreviewModal({
  module,
  onClose,
}: { module: TrainingModule | null; onClose: () => void }) {
  if (!module) return null;

  return (
    <Modal isOpen={!!module} onClose={onClose} title="Training Preview" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Module header */}
        <div className="bg-surface-750 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h2 className="text-base font-bold text-surface-50">{module.title}</h2>
              <p className="text-xs text-surface-400 mt-0.5 capitalize">{module.category}</p>
            </div>
            <StatusBadge status={difficultyBadge[module.difficulty].status}>
              {difficultyBadge[module.difficulty].label}
            </StatusBadge>
          </div>
          <div className="flex items-center gap-3 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {module.durationMin} min
            </span>
          </div>
        </div>

        <p className="text-sm text-surface-200 leading-relaxed">{module.description}</p>

        {module.recommendationReason && (
          <div className="bg-brand-500/8 border border-brand-500/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-brand-400 mb-1">Why recommended for you</p>
            <p className="text-xs text-surface-300">{module.recommendationReason}</p>
          </div>
        )}

        {/* Demo notice */}
        <div className="bg-surface-750 border border-surface-600 rounded-lg p-3">
          <p className="text-xs text-surface-400 flex items-center gap-1.5">
            <BookOpen size={12} className="text-brand-400" />
            <span>
              <strong className="text-surface-300">Phase 1 Demo:</strong> Full training content will be
              integrated in Phase 2. This is a placeholder preview.
            </span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary flex-1 justify-center"
            onClick={() => {
              console.log('[MOCK] Start training:', module.id);
              onClose();
            }}
          >
            <Play size={14} />
            Start Training
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Training Module Card ──────────────────────────────────

function ModuleCard({
  module,
  onStart,
}: { module: TrainingModule; onStart: (m: TrainingModule) => void }) {
  const statusCfg = statusConfig[module.status];
  const StatusIcon = statusCfg.icon;
  const diff = difficultyBadge[module.difficulty];

  return (
    <Card
      className="p-4 cursor-pointer hover:border-surface-600 transition-all duration-150"
      onClick={() => onStart(module)}
      hover
    >
      <div className="flex items-start gap-3">
        {/* Icon area */}
        <div className="w-10 h-10 rounded-xl bg-surface-750 border border-surface-700
                        flex items-center justify-center shrink-0">
          <GraduationCap size={18} className={categoryColor[module.category]} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-surface-100">{module.title}</h3>
              {module.isRecommended && (
                <StatusBadge status="brand" dot={false} className="text-xs">Recommended</StatusBadge>
              )}
            </div>
            <StatusIcon size={14} className={`shrink-0 mt-0.5 ${statusCfg.color}`} />
          </div>

          <div className="flex items-center gap-3 text-xs text-surface-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {module.durationMin} min
            </span>
            <StatusBadge status={diff.status} dot={false}>{diff.label}</StatusBadge>
          </div>

          {module.recommendationReason && (
            <p className="text-xs text-surface-500 leading-relaxed mb-2 line-clamp-2">
              {module.recommendationReason}
            </p>
          )}

          {/* Progress bar for in-progress */}
          {module.status === 'in-progress' && module.progressPct !== undefined && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-surface-500">Progress</span>
                <span className="text-surface-400 font-mono">{module.progressPct}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-status-info"
                  style={{ width: `${module.progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={module.progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Training Page ────────────────────────────────────

export default function Training() {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        const opId = operators.length > 0 ? operators[0].operator_id : 'OP-001';

        const [modulesData, progData] = await Promise.all([
          api.getTrainingModules(),
          api.getTrainingProgress(opId)
        ]);
        
        const mappedModules = modulesData.map((m: any) => {
          const p = progData.find((prog: any) => prog.training_id === m.training_id) || {};
          return {
            id: m.training_id,
            title: m.title,
            description: m.description,
            category: m.category?.toLowerCase() || 'operation',
            difficulty: m.difficulty?.toLowerCase() || 'beginner',
            durationMin: m.duration_min,
            status: p.status === 'Completed' ? 'completed' : p.status === 'In Progress' ? 'in-progress' : 'not-started',
            progressPct: p.score || 0,
            isRecommended: p.reason_recommended != null,
            recommendationReason: p.reason_recommended
          };
        });
        
        setModules(mappedModules);
        
        // Calculate overall progress based on the array
        const completed = progData.filter((p: any) => p.status === 'Completed').length;
        const total = modulesData.length > 0 ? modulesData.length : 1;
        setProgressData({
          overall_progress: (completed / total) * 100
        });
      } catch (err) {
        console.error("Failed to load training data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const recommended = modules.filter((m) => m.isRecommended);
  const other = modules.filter((m) => !m.isRecommended);

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const totalCount     = modules.length;
  const trainingProgress = progressData?.overall_progress ? Math.round(progressData.overall_progress) : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <GraduationCap size={22} className="text-brand-400" />
              <h1 className="text-2xl font-bold text-surface-50">Operator Training Hub</h1>
            </div>
            <p className="text-sm text-surface-400">
              Personalized training recommendations based on your operational data and behavior patterns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Award size={16} className="text-brand-400" />
            <span className="text-sm text-surface-200 font-medium">
              {completedCount} / {totalCount} completed
            </span>
          </div>
        </div>

        {/* Overall progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-surface-100">Overall Training Progress</h2>
              <p className="text-xs text-surface-400 mt-0.5">Alex Morgan · OP-1007</p>
            </div>
            <span className="text-2xl font-bold text-brand-400">{trainingProgress}%</span>
          </div>
          <div className="progress-bar h-3">
            <div
              className="progress-fill bg-brand-500"
              style={{ width: `${trainingProgress}%` }}
              role="progressbar"
              aria-valuenow={trainingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Training progress: ${trainingProgress}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-surface-500 mt-2">
            <span>{completedCount} modules completed</span>
            <span>{totalCount - completedCount} remaining</span>
          </div>
        </Card>

        {/* Recommended */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Recommended for You</p>
            <StatusBadge status="brand" dot={false}>{recommended.length} modules</StatusBadge>
          </div>
          {loading ? (
             <div className="text-surface-400 text-sm">Loading modules...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommended.map((m) => (
                <ModuleCard key={m.id} module={m} onStart={setSelectedModule} />
              ))}
            </div>
          )}
        </section>

        {/* Other modules */}
        <section>
          <p className="section-label mb-3">All Training Modules</p>
          {loading ? (
             <div className="text-surface-400 text-sm">Loading modules...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {other.map((m) => (
                <ModuleCard key={m.id} module={m} onStart={setSelectedModule} />
              ))}
            </div>
          )}
        </section>
      </div>

      <TrainingPreviewModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
      />
    </>
  );
}
