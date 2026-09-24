import type { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ className = '', children, hover = false, onClick }: CardProps) {
  const base = hover ? 'card-hover cursor-pointer' : 'card';
  return (
    <div
      className={`${base} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, icon, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 text-surface-400">{icon}</div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-surface-100 truncate">{title}</h2>
          {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Section({ title, children, className = '', action }: SectionProps) {
  return (
    <section className={className}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
