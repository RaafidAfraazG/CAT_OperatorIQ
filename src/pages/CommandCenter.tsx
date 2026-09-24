import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  AlertTriangle, Shield, Brain, Cpu, GraduationCap, Fuel, Timer, TrendingUp,
  Truck, Users, ClipboardList, Bell
} from 'lucide-react';
import MachineCard from '../components/dashboard/MachineCard';
import CurrentTaskCard from '../components/dashboard/CurrentTaskCard';
import MetricCard from '../components/dashboard/MetricCard';
import SafetyStatusCard from '../components/dashboard/SafetyStatusCard';
import AIInsightCard from '../components/dashboard/AIInsightCard';
import TaskTimeline from '../components/dashboard/TaskTimeline';
import { api } from '../api/client';

export default function CommandCenter() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [operator, setOperator] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const [data, operators] = await Promise.all([
          api.getDashboardSummary(),
          api.getOperators()
        ]);
        setSummary(data);
        
        if (operators.length > 0) {
          const op = operators[0];
          setOperator(op);
          
          const tasks = await api.getTasks({ operator_id: op.operator_id, status: 'In Progress' });
          if (tasks.length > 0) {
            setTask(tasks[0]);
            const m = await api.getMachine(tasks[0].machine_id);
            setMachine(m);
          } else {
            const machines = await api.getMachines();
            setMachine(machines[0]);
          }
        }
      } catch (err) {
        setError('Unable to load live dashboard data. Please check that the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const now    = new Date();
  const hour   = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' : 'Good evening';

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const quickActions = [
    {
      label: 'Report Incident',
      icon: AlertTriangle,
      route: '/safety',
      color: 'text-status-critical',
      bg: 'bg-status-criticalD/10 border-status-criticalD/20 hover:bg-status-criticalD/20',
    },
    {
      label: 'Safety Monitor',
      icon: Shield,
      route: '/safety',
      color: 'text-status-safe',
      bg: 'bg-status-safeD/10 border-status-safeD/20 hover:bg-status-safeD/20',
    },
    {
      label: 'Start Training',
      icon: GraduationCap,
      route: '/training',
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20 hover:bg-brand-500/20',
    },
    {
      label: 'Machine Insights',
      icon: Cpu,
      route: '/machine',
      color: 'text-status-info',
      bg: 'bg-status-infoD/10 border-status-infoD/20 hover:bg-status-infoD/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50">
          {greeting}{operator ? `, ${(operator.name || operator.operator_id || '').split(' ')[0]}` : ''}
        </h1>
        <p className="text-surface-400 mt-1 text-sm">
          Here's your operational overview for today · <span className="text-surface-300">{dateStr}</span>
        </p>
      </div>

      {error && (
        <div className="bg-status-criticalD/10 border border-status-criticalD/20 text-status-critical p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Top row: Machine + Current Task */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {machine && <MachineCard machine={machine} />}
        {task && <CurrentTaskCard task={task} />}
      </div>

      {/* KPI metrics */}
      <section aria-label="Key Operational Metrics">
        <p className="section-label mb-3">Key Operational Metrics</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full text-surface-400 text-sm">Loading summary metrics...</div>
          ) : (
            <>
              <MetricCard
                label="Active Machines"
                value={summary?.active_machines?.toString() || "0"}
                subValue="Deployed"
                subLabel="Status:"
                status="safe"
                icon={<Truck size={16} />}
              />
              <MetricCard
                label="Active Operators"
                value={summary?.active_operators?.toString() || "0"}
                subValue="On shift"
                subLabel="Status:"
                status="info"
                icon={<Users size={16} />}
              />
              <MetricCard
                label="Pending Tasks"
                value={summary?.pending_tasks?.toString() || "0"}
                subValue="In queue"
                subLabel="Status:"
                status="warning"
                icon={<ClipboardList size={16} />}
              />
              <MetricCard
                label="Active Alerts"
                value={summary?.active_alerts?.toString() || "0"}
                subValue="Require attention"
                subLabel="Status:"
                status={summary?.active_alerts > 0 ? "critical" : "safe"}
                icon={<Bell size={16} />}
              />
            </>
          )}
        </div>
      </section>

      {/* Middle row: Safety + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SafetyStatusCard />
        <AIInsightCard />
      </div>

      {/* Bottom row: Task timeline + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TaskTimeline />
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-surface-400" />
            <h2 className="text-sm font-semibold text-surface-100">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ label, icon: Icon, route, color, bg }) => (
              <button
                key={label}
                onClick={() => navigate(route)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-xl border
                  transition-all duration-150 text-center cursor-pointer
                  ${bg}
                `}
                aria-label={label}
              >
                <Icon size={20} className={color} />
                <span className="text-xs font-medium text-surface-200 text-balance leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
