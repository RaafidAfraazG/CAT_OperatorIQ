import { useState, useEffect } from 'react';
import { Brain, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../api/client';

interface CurrentTaskCardProps {
  task: any;
}

export default function CurrentTaskCard({ task }: CurrentTaskCardProps) {
  const [eta, setEta] = useState<any>(null);

  useEffect(() => {
    if (task && task.task_id) {
      api.getTaskEta(task.task_id).then(setEta).catch(console.error);
    }
  }, [task]);

  if (!task) return null;

  const progressPct = task.task_efficiency ? Math.round(task.task_efficiency * 100) : 50;
  
  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="section-label mb-1">Current Task</p>
          <h2 className="text-lg font-bold text-surface-50 capitalize">{task.task_type.replace('_', ' ')}</h2>
          <p className="text-sm text-surface-400">{task.site_id} · {task.task_id}</p>
        </div>
        <StatusBadge status="brand" dot={false}>
          <Brain size={11} className="shrink-0" />
          AI Tracked
        </StatusBadge>
      </div>

      {/* Progress */}
      <div className="mt-4 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold text-surface-50">{progressPct}%</span>
          <span className="text-xs text-surface-400">efficiency</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill bg-brand-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Time stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
        <div className="bg-surface-750 rounded-lg p-2.5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={10} className="text-surface-400" />
            <span className="text-xs text-surface-400">Scheduled Duration</span>
          </div>
          <p className="text-sm font-semibold font-mono text-surface-100">
            {task.estimated_duration_min} min
          </p>
        </div>
        
        <div className="bg-surface-750 rounded-lg p-2.5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Brain size={10} className="text-brand-400" />
            <span className="text-xs text-brand-400">AI Predicted</span>
          </div>
          <p className={`text-sm font-semibold font-mono ${eta && eta.status === 'likely_delayed' ? 'text-status-warn' : 'text-surface-100'}`}>
            {eta ? `${eta.predicted_duration_min} min` : 'Predicting...'}
          </p>
        </div>
      </div>

      {/* AI Confidence + factors */}
      {eta && (
        <div className="border-t border-surface-700 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Brain size={12} className="text-brand-400" />
              <span className="text-xs font-medium text-surface-300">Variance Prediction</span>
            </div>
            <span className={`text-sm font-bold ${eta.delay_minutes > 0 ? 'text-status-warn' : 'text-status-safe'}`}>
              {eta.delay_minutes > 0 ? `+${eta.delay_minutes}` : eta.delay_minutes} min
            </span>
          </div>
          <div className="text-xs text-surface-400 text-right capitalize">
            {eta.status.replace('_', ' ')}
          </div>
        </div>
      )}
    </Card>
  );
}
