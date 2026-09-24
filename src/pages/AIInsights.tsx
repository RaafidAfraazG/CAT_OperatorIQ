import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, Fuel, Shield, Activity, ChevronRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { SeverityBadge } from '../components/common/StatusBadge';
import type { InsightCategory, Insight } from '../types';
import { api } from '../api/client';

type FilterOption = 'all' | InsightCategory;

const filters: { value: FilterOption; label: string }[] = [
  { value: 'all',          label: 'All'          },
  { value: 'safety',       label: 'Safety'       },
  { value: 'productivity', label: 'Productivity' },
  { value: 'fuel',         label: 'Fuel'         },
  { value: 'behavior',     label: 'Behavior'     },
];

const categoryIconMap: Record<InsightCategory, React.ElementType> = {
  safety:       Shield,
  productivity: TrendingUp,
  fuel:         Fuel,
  behavior:     Activity,
};

const categoryColorMap: Record<InsightCategory, string> = {
  safety:       'text-status-critical bg-status-criticalD/10 border-status-criticalD/20',
  productivity: 'text-status-info bg-status-infoD/10 border-status-infoD/20',
  fuel:         'text-status-warn bg-status-warnD/10 border-status-warnD/20',
  behavior:     'text-brand-400 bg-brand-500/10 border-brand-500/20',
};

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = categoryIconMap[insight.category];
  const colorClass = categoryColorMap[insight.category];

  return (
    <Card className="p-5">
      {/* Category + severity */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${colorClass}`}>
          <Icon size={12} />
          {insight.category.toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={insight.severity} />
          <span className="text-xs text-surface-500">{insight.timestamp}</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-base font-bold text-surface-50 mb-1">{insight.title}</h2>
      <p className="text-sm text-surface-300 mb-4 leading-relaxed">{insight.summary}</p>

      {/* Metrics */}
      {insight.metrics && insight.metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {insight.metrics.map((m) => (
            <div key={m.label} className="bg-surface-750 rounded-lg px-3 py-2.5 text-center">
              <p className="text-xs text-surface-400 mb-1">{m.label}</p>
              <p className="text-sm font-bold font-mono text-surface-100">{m.value}</p>
              {m.subLabel && <p className="text-xs text-surface-500">{m.subLabel}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="border-t border-surface-700 pt-3">
        <div className="flex items-start gap-2">
          <ChevronRight size={13} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
              Recommendation
            </p>
            <p className="text-xs text-surface-300 leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AIInsights() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [liveInsights, setLiveInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        if (operators.length > 0) {
          const intel = await api.getOperatorIntelligence(operators[0].operator_id);
          
          // Map backend intelligence into the UI format
          const mapped: Insight[] = (intel.insights || []).map((insight: any, idx: number) => {
            const text = insight.message || '';
            let category: InsightCategory = 'productivity';
            let severity: 'info' | 'warning' | 'critical' = 'info';
            
            const lower = text.toLowerCase();
            if (lower.includes('health') || lower.includes('wear') || lower.includes('machine') || lower.includes('attention')) category = 'behavior';
            if (lower.includes('fuel')) category = 'fuel';
            if (lower.includes('safety') || lower.includes('risk')) category = 'safety';
            
            if (insight.severity === 'high' || insight.severity === 'critical') severity = 'critical';
            else if (insight.severity === 'medium' || insight.severity === 'warning') severity = 'warning';
            else severity = 'info';
            
            return {
              id: `intel-${idx}`,
              category,
              severity,
              title: category.charAt(0).toUpperCase() + category.slice(1) + ' Insight',
              summary: text,
              recommendation: 'Review standard operating procedures and machine telemetry.',
              timestamp: 'Just now',
            };
          });
          
          setLiveInsights(mapped);
        }
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const displayedInsights = activeFilter === 'all' 
    ? liveInsights 
    : liveInsights.filter((i) => i.category === activeFilter);

  const counts = {
    warning:  liveInsights.filter((i) => i.severity === 'warning').length,
    critical: liveInsights.filter((i) => i.severity === 'critical').length,
    info:     liveInsights.filter((i) => i.severity === 'info').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Brain size={22} className="text-brand-400" />
          <h1 className="text-2xl font-bold text-surface-50">AI Insights</h1>
        </div>
        <p className="text-sm text-surface-400">
          OperatorIQ continuously analyzes machine, task, safety and environmental signals
          to surface actionable intelligence.
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center border-l-2 border-l-status-warn">
          <p className="text-2xl font-bold text-status-warn">{counts.warning}</p>
          <p className="text-xs text-surface-400 mt-0.5">Warnings</p>
        </Card>
        <Card className="p-4 text-center border-l-2 border-l-status-critical">
          <p className="text-2xl font-bold text-status-critical">{counts.critical}</p>
          <p className="text-xs text-surface-400 mt-0.5">Critical</p>
        </Card>
        <Card className="p-4 text-center border-l-2 border-l-status-info">
          <p className="text-2xl font-bold text-status-info">{counts.info}</p>
          <p className="text-xs text-surface-400 mt-0.5">Informational</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter insights by category">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
              activeFilter === value
                ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                : 'bg-surface-800 text-surface-400 border-surface-700 hover:text-surface-200 hover:border-surface-600'
            }`}
            aria-pressed={activeFilter === value}
          >
            {label}
            {value !== 'all' && (
              <span className="ml-1.5 text-surface-500">
                ({liveInsights.filter((i) => i.category === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Insight cards */}
      {loading ? (
         <div className="text-center py-16 text-surface-500">
           <Brain size={40} className="mx-auto mb-3 opacity-30 animate-pulse" />
           <p className="text-sm">Analyzing live signals...</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {displayedInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {!loading && displayedInsights.length === 0 && (
        <div className="text-center py-16 text-surface-500">
          <Brain size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No insights in this category.</p>
        </div>
      )}
    </div>
  );
}
