import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../common/Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  subLabel?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral'; positive?: boolean };
  status?: 'safe' | 'warning' | 'critical' | 'info' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

const statusColorMap = {
  safe:     'text-status-safe',
  warning:  'text-status-warn',
  critical: 'text-status-critical',
  info:     'text-status-info',
  neutral:  'text-surface-300',
};

const statusBorderMap = {
  safe:     'border-l-2 border-l-status-safe',
  warning:  'border-l-2 border-l-status-warn',
  critical: 'border-l-2 border-l-status-critical',
  info:     'border-l-2 border-l-status-info',
  neutral:  '',
};

export default function MetricCard({
  label,
  value,
  unit,
  subValue,
  subLabel,
  trend,
  status = 'neutral',
  icon,
  className = '',
}: MetricCardProps) {
  const valueColor = statusColorMap[status];

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus;

  const trendGood = trend?.positive !== false
    ? trend?.direction === 'up'
    : trend?.direction === 'down';

  const trendColor = trendGood ? 'text-status-safe' : 'text-status-warn';

  return (
    <Card className={`p-4 ${statusBorderMap[status]} ${className}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          {label}
        </span>
        {icon && <span className={`${valueColor} opacity-70`}>{icon}</span>}
      </div>

      {/* Primary value */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        {unit && <span className="text-sm text-surface-400">{unit}</span>}
      </div>

      {/* Sub value */}
      {subValue && (
        <p className="text-xs text-surface-400">
          {subLabel && <span className="mr-1">{subLabel}</span>}
          <span className="font-medium text-surface-300">{subValue}</span>
        </p>
      )}

      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={12} />
          <span>{trend.value}</span>
        </div>
      )}
    </Card>
  );
}
