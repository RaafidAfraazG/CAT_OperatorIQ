import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  BarChart3, CheckCircle2, TrendingUp, Fuel, Shield, Brain, Clock,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { mockShiftSummary } from '../data/mockShiftReport';
import { api } from '../api/client';

function KPICard({
  label, value, unit, delta, deltaLabel, icon, color,
}: {
  label: string; value: string | number; unit?: string;
  delta?: string; deltaLabel?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs text-surface-400">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {unit && <span className="text-sm text-surface-400">{unit}</span>}
      </div>
      {delta && (
        <p className="text-xs text-surface-500">
          {deltaLabel && `${deltaLabel}: `}
          <span className="font-medium text-surface-300">{delta}</span>
        </p>
      )}
    </Card>
  );
}

function ChartTooltipCustom({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-surface-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value}{p.name.includes('Fuel') ? ' L' : ' min'}
        </p>
      ))}
    </div>
  );
}

export default function ShiftReport() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [operator, setOperator] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        let currentOp = null;
        if (operators.length > 0) {
          currentOp = operators[0];
          setOperator(currentOp);
          const intel = await api.getOperatorIntelligence(currentOp.operator_id);
          setIntelligence(intel);
        }

        let tasksData: any[] = [];
        if (currentOp) {
           tasksData = await api.getTasks({ operator_id: currentOp.operator_id });
        } else {
           tasksData = await api.getTasks();
        }
        
        // Limit to 5 tasks for the report UI
        setTasks(tasksData.slice(0, 5));
      } catch (err) {
        console.error("Failed to load shift data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const s = mockShiftSummary;

  // Mix of real and mock data for MVP
  const realTaskSummaries = tasks.map((t: any) => ({
    taskId: t.task_id,
    title: t.task_type.replace('_', ' '),
    estimatedMin: Math.round(t.estimated_duration_min || 0),
    actualMin: Math.round(t.actual_duration_min || t.estimated_duration_min || 0),
    fuelL: Math.round((t.estimated_duration_min || 0) * 0.15) // Rough estimate for UI
  }));

  const activeSummaries = realTaskSummaries.length > 0 ? realTaskSummaries : s.taskSummaries;

  // Task comparison chart data
  const taskChartData = activeSummaries.map((t) => ({
    name: t.title.split(' ')[0], // abbreviate
    Estimated: t.estimatedMin,
    Actual:    t.actualMin,
  }));

  // Fuel by hour
  const fuelData = s.hourlyFuel.map((h) => ({
    hour: h.hour,
    'Fuel (L)': h.liters,
  }));
  
  const recommendation = intelligence?.insights?.map((i: any) => i.message).join(' ') || s.recommendation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <BarChart3 size={22} className="text-brand-400" />
            <h1 className="text-2xl font-bold text-surface-50">Shift Summary</h1>
          </div>
          <p className="text-sm text-surface-400">
            {operator ? operator.name : 'Operator'} · {operator ? operator.operator_id : 'ID'} ·{' '}
            <span className="text-surface-300">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-safe">Shift Complete</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          label="Tasks Completed"
          value={tasks.filter(t => (t.task_status || '').toLowerCase() === 'completed').length || `${s.tasksCompleted}/${s.tasksTotal}`}
          icon={<CheckCircle2 size={16} />}
          color="text-status-safe"
          delta="Tasks finished"
        />
        <KPICard
          label="Productivity"
          value={`${s.productivityPct}%`}
          icon={<TrendingUp size={16} />}
          color="text-brand-400"
          delta={`+${s.productivityDelta}% vs prev`}
        />
        <KPICard
          label="Fuel Efficiency"
          value={`+${s.fuelEfficiencyDelta}%`}
          icon={<Fuel size={16} />}
          color="text-status-info"
          delta="vs. operator avg."
        />
        <KPICard
          label="Idle Ratio"
          value={`${s.idleRatioPct}%`}
          icon={<Clock size={16} />}
          color="text-status-warn"
          delta="Target: <10%"
        />
        <KPICard
          label="Seatbelt"
          value={`${s.seatbeltCompliancePct}%`}
          icon={<Shield size={16} />}
          color="text-status-safe"
          delta="Compliance"
        />
        <KPICard
          label="AI Accuracy"
          value={`${s.predictionAccuracyPct}%`}
          icon={<Brain size={16} />}
          color="text-brand-400"
          delta="Task prediction"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Task duration comparison */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-1">Task Duration: Estimated vs Actual</h2>
          <p className="text-xs text-surface-500 mb-4">Minutes per task</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8691a0' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8691a0' }} />
              <Tooltip content={<ChartTooltipCustom />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8691a0', paddingTop: '8px' }} />
              <Bar dataKey="Estimated" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Actual"    fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Hourly fuel */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-1">Fuel Usage by Hour</h2>
          <p className="text-xs text-surface-500 mb-4">Litres consumed per hour</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fuelData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8691a0' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8691a0' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#181c27', border: '1px solid #2d3548', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: '#8691a0' }}
              />
              <ReferenceLine y={15.2} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ value: 'Baseline', position: 'insideTopRight', fontSize: 10, fill: '#22c55e' }} />
              <Line
                type="monotone"
                dataKey="Fuel (L)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Task summary table */}
      <Card>
        <div className="px-5 py-4 border-b border-surface-700">
          <h2 className="text-sm font-semibold text-surface-100">Task Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Fuel Used</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4 text-surface-400">Loading tasks...</td></tr>
              ) : activeSummaries.map((t) => {
                const variance = t.actualMin - t.estimatedMin;
                return (
                  <tr key={t.taskId}>
                    <td className="font-medium text-surface-100 capitalize">{t.title}</td>
                    <td className="font-mono">{t.estimatedMin} min</td>
                    <td className="font-mono">{t.actualMin} min</td>
                    <td>
                      <span className={`font-mono font-medium ${
                        variance > 0 ? 'text-status-warn' : 'text-status-safe'
                      }`}>
                        {variance > 0 ? '+' : ''}{variance} min
                      </span>
                    </td>
                    <td className="font-mono">{t.fuelL} L</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI recommendation */}
      <Card className="p-5 border-brand-500/20 bg-gradient-to-br from-surface-800 to-surface-850">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30
                          flex items-center justify-center shrink-0">
            <Brain size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-400 mb-1">OperatorIQ AI Insights</p>
            <p className="text-sm text-surface-200 leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
