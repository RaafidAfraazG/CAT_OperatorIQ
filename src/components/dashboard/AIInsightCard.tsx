import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Info } from 'lucide-react';
import { Card } from '../common/Card';

export default function AIInsightCard() {
  const navigate = useNavigate();

  const factors = [
    { label: 'Soil moisture',       delta: '+8 min' },
    { label: 'Terrain slope',       delta: '+4 min' },
    { label: 'Operator experience', delta: '-3 min' },
  ];

  return (
    <Card className="p-5 border-brand-500/20 bg-gradient-to-br from-surface-800 to-surface-850">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30
                        flex items-center justify-center">
          <Brain size={14} className="text-brand-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-surface-100">OperatorIQ Insight</h2>
          <p className="text-xs text-brand-400 font-medium">AI Analysis · Phase 1 Demo</p>
        </div>
      </div>

      {/* Insight text */}
      <p className="text-sm text-surface-200 leading-relaxed mb-4">
        Your current task is progressing normally.{' '}
        <span className="text-surface-100 font-medium">
          Higher soil moisture is expected to add approximately 11 minutes to completion.
        </span>
      </p>

      {/* Why this matters */}
      <div className="border-t border-surface-700 pt-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Info size={12} className="text-surface-400" />
          <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Why this matters
          </span>
        </div>
        <div className="space-y-1.5">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-xs">
              <span className="text-surface-400 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-surface-500" aria-hidden="true" />
                {f.label}
              </span>
              <span className={`font-mono font-medium ${
                f.delta.startsWith('+') ? 'text-status-warn' : 'text-status-safe'
              }`}>
                {f.delta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn-primary w-full justify-center"
        onClick={() => navigate('/insights')}
        aria-label="View all AI Insights"
      >
        <Brain size={14} />
        View AI Insights
        <ChevronRight size={14} className="ml-auto" />
      </button>
    </Card>
  );
}
