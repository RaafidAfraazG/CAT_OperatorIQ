import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: 'safe' | 'warning' | 'critical' | 'info' | 'neutral' | 'brand';
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, children, dot = true, className = '' }: StatusBadgeProps) {
  const classMap: Record<string, string> = {
    safe:     'badge-safe',
    warning:  'badge-warn',
    critical: 'badge-critical',
    info:     'badge-info',
    neutral:  'badge-neutral',
    brand:    'badge-brand',
  };
  const dotMap: Record<string, string> = {
    safe:     'bg-status-safe',
    warning:  'bg-status-warn',
    critical: 'bg-status-critical',
    info:     'bg-status-info',
    neutral:  'bg-surface-400',
    brand:    'bg-brand-400',
  };

  return (
    <span className={`badge ${classMap[status]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

// ─── Task status badge ─────────────────────────────────────

import type { TaskStatus } from '../../types';

const taskStatusConfig: Record<TaskStatus, { label: string; status: StatusBadgeProps['status'] }> = {
  'in-progress': { label: 'In Progress', status: 'info'     },
  'scheduled':   { label: 'Scheduled',   status: 'neutral'  },
  'completed':   { label: 'Completed',   status: 'safe'     },
  'delayed':     { label: 'Delayed',     status: 'warning'  },
  'cancelled':   { label: 'Cancelled',   status: 'critical' },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase().replace(' ', '-') as TaskStatus;
  const cfg = taskStatusConfig[normalized] || { label: status, status: 'neutral' };
  return <StatusBadge status={cfg.status as StatusBadgeProps['status']}>{cfg.label || 'Unknown'}</StatusBadge>;
}

// ─── Severity badge ────────────────────────────────────────

import type { InsightSeverity } from '../../types';

const severityMap: Record<InsightSeverity, StatusBadgeProps['status']> = {
  info:     'info',
  warning:  'warning',
  critical: 'critical',
};

export function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  return (
    <StatusBadge status={severityMap[severity]}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </StatusBadge>
  );
}
