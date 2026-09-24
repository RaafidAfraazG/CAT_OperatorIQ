import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ClipboardList, ChevronRight, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import { TaskStatusBadge } from '../common/StatusBadge';
import { api } from '../../api/client';

const dotColorMap: Record<string, string> = {
  'In Progress': 'bg-status-info',
  'Scheduled':   'bg-surface-500',
  'Completed':   'bg-status-safe',
  'Delayed':     'bg-status-warn',
  'Cancelled':   'bg-status-critical',
};

export default function TaskTimeline() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, machinesData] = await Promise.all([
          api.getTasks(),
          api.getMachines()
        ]);
        
        // Filter to recent tasks (completed, in-progress, scheduled) and take 4
        const displayTasks = tasksData
          .filter((t: any) => ['Completed', 'In Progress', 'Scheduled'].includes(t.task_status))
          .slice(0, 4);
          
        setTasks(displayTasks);
        setMachines(machinesData);
      } catch (err) {
        console.error("Failed to load task timeline", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-surface-400" />
          <h2 className="text-sm font-semibold text-surface-100">Today's Tasks</h2>
        </div>
        <button
          className="btn-ghost text-xs px-2 py-1"
          onClick={() => navigate('/tasks')}
          aria-label="View all tasks"
        >
          View All
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-surface-700" aria-hidden="true" />

        <div className="space-y-1">
          {loading ? (
             <div className="pl-10 text-xs text-surface-400">Loading tasks...</div>
          ) : tasks.length === 0 ? (
             <div className="pl-10 text-xs text-surface-400">No tasks found.</div>
          ) : tasks.map((task, idx) => {
            const machine = machines.find((m) => m.machine_id === task.machine_id);
            const dotColor = dotColorMap[task.task_status] ?? 'bg-surface-500';
            const isActive = task.task_status === 'In Progress';

            return (
              <button
                key={task.task_id}
                className="relative w-full flex items-start gap-3 pl-10 pr-2 py-2.5 rounded-lg
                           text-left hover:bg-surface-750 transition-colors duration-100 group"
                onClick={() => navigate('/tasks')}
                aria-label={`${task.task_type} - ${task.task_status}`}
              >
                {/* Timeline dot */}
                <div className={`
                  absolute left-[13px] top-3.5 w-3 h-3 rounded-full border-2
                  border-surface-800 ${dotColor}
                  ${isActive ? 'ring-2 ring-status-info/30' : ''}
                `} aria-hidden="true" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate capitalize">{task.task_type.replace('_', ' ')}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-500">{task.site_id}</span>
                        {machine && (
                          <>
                            <span className="text-surface-700">·</span>
                            <span className="text-xs text-surface-500 capitalize">{machine.model || machine.machine_type}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <TaskStatusBadge status={task.task_status.toLowerCase().replace(' ', '-')} />
                  </div>
                </div>

                {/* Time */}
                <div className="shrink-0 flex items-center gap-1 text-xs text-surface-500 mt-0.5">
                  <Clock size={10} />
                  {task.estimated_duration_min}m
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
