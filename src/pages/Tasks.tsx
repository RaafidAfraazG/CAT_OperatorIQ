import { useState, useEffect } from 'react';
import { ClipboardList, Clock, MapPin, Cpu, ChevronRight, Timer } from 'lucide-react';
import { Card } from '../components/common/Card';
import { TaskStatusBadge } from '../components/common/StatusBadge';
import type { Task } from '../types';
import { api } from '../api/client';

// Summary stats calculated dynamically

function TaskDetailPanel({ task, machines }: { task: Task, machines: any[] }) {
  const [eta, setEta] = useState<any>(null);
  
  useEffect(() => {
    if (task && task.id) {
      api.getTaskEta(task.id).then(setEta).catch(console.error);
    }
  }, [task]);

  const machine = machines.find((m) => m.machine_id === task.machineId);
  const machineName = machine ? (machine.model || machine.machine_type) : task.machineId;

  return (
    <Card className="p-5 h-full">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <p className="section-label mb-1">Task Detail</p>
          <h2 className="text-lg font-bold text-surface-50 capitalize">{task.title.replace('_', ' ')}</h2>
          <p className="text-xs font-mono text-surface-400">{task.id}</p>
        </div>
        <TaskStatusBadge status={task.status.toLowerCase().replace(' ', '-')} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Machine',   value: machineName, icon: Cpu      },
          { label: 'Zone',      value: task.zone,               icon: MapPin  },
          { label: 'Scheduled', value: task.scheduledStart,     icon: Clock   },
          { label: 'Est. Duration', value: `${task.estimatedDurationMin} min`, icon: Timer },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface-750 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} className="text-surface-400" />
              <span className="text-xs text-surface-400">{label}</span>
            </div>
            <p className="text-sm font-medium text-surface-100 truncate capitalize">{value}</p>
          </div>
        ))}
      </div>

      {task.progressPercent !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-surface-400">Efficiency</span>
            <span className="text-xs font-mono font-semibold text-surface-100">
              {task.progressPercent}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-status-info"
              style={{ width: `${task.progressPercent}%` }}
              role="progressbar"
              aria-valuenow={task.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {eta && (
        <div className="border-t border-surface-700 pt-3">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
            AI Variance Prediction
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Predicted ETA</span>
              <span className="font-mono font-medium text-surface-100">
                {eta.predicted_duration_min} min
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Variance</span>
              <span className={`font-mono font-medium ${
                eta.delay_minutes > 0 ? 'text-status-warn' : 'text-status-safe'
              }`}>
                {eta.delay_minutes > 0 ? '+' : ''}{eta.delay_minutes} min
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, machinesData] = await Promise.all([
          api.getTasks(),
          api.getMachines()
        ]);
        
        const mappedTasks: Task[] = tasksData.map((t: any) => ({
          id: t.task_id,
          title: t.task_type,
          status: t.task_status,
          machineId: t.machine_id,
          operatorId: t.operator_id,
          zone: t.site_id,
          scheduledStart: new Date(t.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          estimatedDurationMin: Math.round(t.estimated_duration_min || 0),
          progressPercent: t.task_efficiency ? Math.round(t.task_efficiency) : undefined,
        }));
        
        setTasks(mappedTasks);
        setMachines(machinesData);
        if (mappedTasks.length > 0) {
          setSelectedId(mappedTasks[0].id);
        }
      } catch (err) {
        setError('Unable to load data. Please check that the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? tasks[0];

  const summaryStats = [
    { label: 'Total',       count: tasks.length, color: 'text-surface-300' },
    { label: 'In Progress', count: tasks.filter(t => ['in-progress', 'in progress'].includes((t.status || '').toLowerCase())).length, color: 'text-status-info' },
    { label: 'Upcoming',    count: tasks.filter(t => ['scheduled', 'pending'].includes((t.status || '').toLowerCase())).length, color: 'text-status-warn' },
    { label: 'Completed',   count: tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length, color: 'text-status-safe' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Today's Tasks</h1>
        <p className="text-sm text-surface-400 mt-1">
          Operational task schedule for the current shift
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-status-criticalD/10 border border-status-criticalD/20 text-status-critical p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map(({ label, count, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-surface-400 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Task list + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Task list */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-700">
              <ClipboardList size={16} className="text-surface-400" />
              <h2 className="text-sm font-semibold text-surface-100">Task Schedule</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Machine</th>
                    <th>Zone</th>
                    <th>Start</th>
                    <th>Est.</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-surface-400">Loading tasks...</td></tr>
                  ) : tasks.map((task) => {
                    const machine = machines.find((m: any) => m.machine_id === task.machineId);
                    const isSelected = task.id === selectedId;

                    return (
                      <tr
                        key={task.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-brand-500/8 !border-l-2 !border-l-brand-500' : ''
                        }`}
                        onClick={() => setSelectedId(task.id)}
                        role="button"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedId(task.id)}
                      >
                        <td>
                          <p className="font-medium text-surface-100 text-sm">{task.title}</p>
                          <p className="text-xs font-mono text-surface-500">{task.id}</p>
                        </td>
                        <td>
                          <span className="text-xs">{machine?.machine_model ?? task.machineId}</span>
                        </td>
                        <td><span className="text-xs">{task.zone}</span></td>
                        <td>
                          <span className="font-mono text-xs">{task.scheduledStart}</span>
                        </td>
                        <td>
                          <span className="font-mono text-xs">{task.estimatedDurationMin} min</span>
                        </td>
                        <td><TaskStatusBadge status={task.status} /></td>
                        <td>
                          <ChevronRight size={14} className={`text-surface-500 ${
                            isSelected ? 'text-brand-400' : ''
                          }`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2">
          {selectedTask ? <TaskDetailPanel task={selectedTask} machines={machines} /> : (
            <Card className="p-5 h-full flex items-center justify-center text-surface-400 text-sm">
              {loading ? 'Loading details...' : 'No task selected'}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
