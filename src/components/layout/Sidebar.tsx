import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Shield,
  Cpu,
  Brain,
  GraduationCap,
  BarChart3,
  Wifi,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { api } from '../../api/client';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/',             label: 'Command Center', icon: LayoutDashboard },
  { to: '/operator',     label: 'Operator View',   icon: User           },
  { to: '/tasks',        label: 'Tasks',           icon: ClipboardList  },
  { to: '/safety',       label: 'Safety',          icon: Shield         },
  { to: '/machine',      label: 'Machine',         icon: Cpu            },
  { to: '/insights',     label: 'AI Insights',     icon: Brain          },
  { to: '/training',     label: 'Training',        icon: GraduationCap  },
  { to: '/shift-report', label: 'Shift Report',    icon: BarChart3      },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [operator, setOperator] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        if (operators.length > 0) {
          const op = operators[0];
          setOperator(op);
          
          const tasks = await api.getTasks({ operator_id: op.operator_id, status: 'In Progress' });
          if (tasks.length > 0) {
            const m = await api.getMachine(tasks[0].machine_id);
            setMachine(m);
          } else {
            const machines = await api.getMachines();
            setMachine(machines[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load sidebar data", err);
      }
    }
    loadData();
  }, []);

  return (
    <aside
      className={`
        relative flex flex-col bg-surface-900 border-r border-surface-700
        transition-all duration-300 ease-in-out shrink-0 h-screen
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-700 min-h-[65px]">
        {/* IQ Mark */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-brand">
          <span className="text-surface-950 font-bold text-sm tracking-tight">IQ</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <span className="text-surface-50 font-bold text-base tracking-tight">OperatorIQ</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className="section-label px-3 mb-3">Navigation</p>
        )}
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Operator Profile */}
      <div className="border-t border-surface-700 p-3">
        {operator && (
          <>
            {collapsed ? (
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                  <span className="text-brand-400 text-xs font-bold">{(operator.name || operator.operator_id || 'OP').substring(0, 2).toUpperCase()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-fade-in">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center shrink-0">
                  <span className="text-brand-400 text-xs font-bold">{(operator.name || operator.operator_id || 'OP').substring(0, 2).toUpperCase()}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-100 truncate">{operator.name || operator.operator_id}</p>
                  <p className="text-xs text-surface-400 truncate capitalize">{operator.skill_level || 'General'} Operator</p>
                  <p className="text-xs font-mono text-surface-500">{operator.operator_id}</p>
                </div>
              </div>
            )}

            {/* Status strip */}
            {!collapsed && machine && (
              <div className="mt-3 pt-3 border-t border-surface-800 space-y-1 animate-fade-in">
                <div className="flex items-center gap-2 text-xs">
                  <Wifi size={11} className="text-status-safe" />
                  <span className="text-status-safe font-medium">Online</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-surface-400">
                  <span className="status-dot status-dot-safe w-1.5 h-1.5" />
                  <span className="truncate">
                    {machine.machine_type} · {machine.machine_id}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-surface-700
                   border border-surface-600 flex items-center justify-center
                   text-surface-400 hover:text-surface-100 hover:bg-surface-600
                   transition-colors duration-150 z-10 shadow-md"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
