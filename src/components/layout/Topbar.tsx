import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/':             'Command Center',
  '/tasks':        'Tasks',
  '/safety':       'Safety Monitor',
  '/machine':      'Machine Insights',
  '/insights':     'AI Insights',
  '/training':     'Training Hub',
  '/shift-report': 'Shift Report',
};

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { pathname } = useLocation();
  const title = routeTitles[pathname] ?? 'OperatorIQ';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <header className="h-16 bg-surface-900 border-b border-surface-700 px-4 md:px-6
                       flex items-center justify-between shrink-0">
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden btn-ghost p-2 rounded-lg"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-surface-100">{title}</h1>
          <p className="text-xs text-surface-400 hidden sm:block">{dateStr}</p>
        </div>
      </div>

      {/* Right: time + notification */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-mono font-medium text-surface-100">{timeStr}</p>
          <p className="text-xs text-surface-500">Local time</p>
        </div>

        <div className="relative">
          <button
            className="btn-ghost p-2 rounded-lg relative"
            aria-label="Notifications (1 unread)"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-warn
                             ring-2 ring-surface-900" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
