import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Task } from '../../types';

export default function WorkScreen() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [eta, setEta] = useState<any>(null);
  
  // Real-time tick for "NOW" in timeline (optional, we can just use static time for now)
  const [nowTimeStr, setNowTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadWorkData() {
      try {
        const [operators, allTasks] = await Promise.all([
          api.getOperators(),
          api.getTasks()
        ]);

        if (operators.length > 0) {
          const activeOp = operators[0];
          
          // Filter tasks by operator and sort by scheduled start
          const opTasks = allTasks
            .filter((t: any) => t.operator_id === activeOp.operator_id)
            .sort((a: any, b: any) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
            
          setTasks(opTasks);

          // Find current task (in-progress) or fallback to first scheduled
          const active = opTasks.find((t: any) => t.task_status.toLowerCase() === 'in progress') || opTasks[0];
          
          if (active) {
            setCurrentTask(active);
            api.getTaskEta(active.task_id).then(setEta).catch(console.error);
          }
        }
      } catch (err) {
        console.error('Failed to load WORK data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4] animate-pulse">SYNCING DISPATCH DATA</p>
      </div>
    );
  }

  // Fallback states if no tasks exist
  if (!currentTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none">
        <p className="text-sm font-bold uppercase tracking-widest text-[#5E676C]">NO ACTIVE ASSIGNMENT</p>
      </div>
    );
  }

  // --- Calculations for Current Task ---
  const taskTitle = currentTask.task_type.replace(/_/g, ' ');
  const taskZone = currentTask.site_id ? `ZONE A • ${currentTask.site_id}` : 'ZONE A • NORTH BENCH';
  // Timeline / Schedule calculations
  const scheduledStart = new Date(currentTask.scheduled_start);
  const startStr = scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scheduledMin = currentTask.estimated_duration_min ?? 120;
  
  const elapsedMin = currentTask.actual_duration_min ?? Math.max(0, Math.floor((new Date().getTime() - scheduledStart.getTime()) / 60000));
  const rawPct = scheduledMin > 0 ? Math.round((elapsedMin / scheduledMin) * 100) : 0;
  const progressPct = Math.min(100, Math.max(0, rawPct));


  const predictedMin = eta?.predicted_duration_min ?? 135;
  const varianceMin = eta?.delay_minutes ?? (predictedMin - scheduledMin);
  const isDelayed = eta ? eta.status === 'likely_delayed' : varianceMin > 0;

  // Calculate Expected End time based on prediction
  const expectedEnd = new Date(scheduledStart.getTime() + predictedMin * 60000);
  const expectedStr = expectedEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- Queue logic ---
  // Tasks before current task in the sorted list are theoretically 'COMPLETED'
  // Task after current task is 'NEXT', remaining are 'LATER'
  const currentIndex = tasks.findIndex(t => t.task_id === currentTask.task_id);
  const nextTask = currentIndex >= 0 && currentIndex + 1 < tasks.length ? tasks[currentIndex + 1] : null;
  const laterTasks = currentIndex >= 0 && currentIndex + 2 < tasks.length ? tasks.slice(currentIndex + 2) : [];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none px-8 py-4 lg:py-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col justify-between gap-4 lg:gap-6 h-full min-h-0">

        {/* 1. CURRENT ASSIGNMENT & TIMELINE */}
        <div className="flex flex-col gap-8">
          
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-[#929A9E] uppercase">
                CURRENT OPERATION
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#F1F3F4] tracking-tight mt-2 uppercase">
                {taskTitle}
              </h1>
              <p className="font-mono text-sm tracking-widest text-[#FFCC00] mt-3 uppercase">
                {taskZone}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-1 text-[#F1F3F4]">
                <span className="text-4xl lg:text-5xl font-extrabold tracking-tighter">
                  {progressPct}%
                </span>
              </div>
              <span className="font-mono text-xs tracking-widest text-[#929A9E] uppercase">
                COMPLETE
              </span>
            </div>
          </div>

          {/* Minimalist Linear Progress Track & Timeline */}
          <div className="w-full flex flex-col gap-3">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-[#141819] relative rounded-full overflow-hidden mt-4">
              <div 
                className="absolute top-0 left-0 h-full bg-[#FFCC00]" 
                style={{ width: `${progressPct}%` }}
              />
            </div>
            
            {/* Timeline markers */}
            <div className="flex justify-between items-center font-mono text-xs font-bold tracking-widest uppercase">
              <div className="flex flex-col text-left">
                <span className="text-[#5E676C] mb-1">START</span>
                <span className="text-[#F1F3F4]">{startStr}</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[#5E676C] mb-1">NOW</span>
                <span className="text-[#F1F3F4]">{nowTimeStr}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[#5E676C] mb-1">EXPECTED</span>
                <span className={`text-[#F1F3F4] ${isDelayed ? 'text-[#F2B84B]' : 'text-[#F1F3F4]'}`}>{expectedStr}</span>
              </div>
            </div>
          </div>
        </div>


        <div className="w-full h-px bg-[#141819]" />

        {/* 2. LOWER REGION: QUEUE & ETA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 flex-1 min-h-0 items-start mt-2">
          
          {/* TASK QUEUE */}
          <div className="flex flex-col font-mono uppercase tracking-widest text-sm w-full max-w-sm flex-1 min-h-0">
            <span className="text-xs text-[#5E676C] font-bold mb-8 shrink-0">DISPATCH QUEUE</span>

            <div className="flex flex-col gap-6 overflow-hidden">
              {/* NOW */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center mt-1 gap-2 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]" />
                  {nextTask && <div className="w-px h-8 bg-[#141819]" />}
                </div>
                <div className="flex flex-col flex-1 pb-2">
                  <span className="text-xs text-[#FFCC00] mb-1">NOW</span>
                  <span className="text-base text-[#F1F3F4] font-bold">{taskTitle}</span>
                  <span className="text-[#929A9E] mt-1 text-xs">{currentTask.task_status || 'IN PROGRESS'}</span>
                </div>
              </div>

              {/* NEXT */}
              {nextTask && (
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center mt-1 gap-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#141819]" />
                    {laterTasks.length > 0 && <div className="w-px h-8 bg-[#141819]" />}
                  </div>
                  <div className="flex flex-col flex-1 pb-2">
                    <span className="text-xs text-[#5E676C] mb-1">NEXT</span>
                    <span className="text-base text-[#929A9E] font-bold">{nextTask.task_type.replace(/_/g, ' ')}</span>
                    <span className="text-[#5E676C] mt-1 text-xs">QUEUED</span>
                  </div>
                </div>
              )}

              {/* LATER (show up to 3) */}
              {laterTasks.slice(0, 3).map((lt: any, idx: number, arr: any[]) => (
                <div className="flex items-start gap-4" key={lt.task_id}>
                  <div className="flex flex-col items-center mt-1 gap-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#141819]" />
                    {idx < arr.length - 1 && <div className="w-px h-8 bg-[#141819]" />}
                  </div>
                  <div className="flex flex-col flex-1 pb-2">
                    <span className="text-xs text-[#5E676C] mb-1">LATER</span>
                    <span className="text-base text-[#5E676C] font-bold">{lt.task_type.replace(/_/g, ' ')}</span>
                    <span className="text-[#5E676C] mt-1 text-xs">QUEUED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SCHEDULE, ETA & ASSIST */}
          <div className="flex flex-col gap-8 lg:items-end">
            <span className="text-xs text-[#5E676C] font-mono font-bold tracking-widest uppercase mb-2 lg:text-right w-full block">AI ETA PREDICTION</span>

            <div className="flex flex-col font-mono text-sm tracking-widest w-72 lg:text-right">
              <div className="flex justify-between lg:justify-end lg:gap-8 border-b border-[#141819] pb-3 mb-4">
                <span className="text-[#929A9E]">SCHEDULED</span>
                <span className="text-[#F1F3F4] font-bold">{scheduledMin} MIN</span>
              </div>
              <div className="flex justify-between lg:justify-end lg:gap-8 border-b border-[#141819] pb-3 mb-4">
                <span className="text-[#929A9E]">PREDICTED</span>
                <span className="text-[#F1F3F4] font-bold">{predictedMin} MIN</span>
              </div>
              <div className="flex justify-between lg:justify-end lg:gap-8 pb-3">
                <span className="text-[#929A9E]">VARIANCE</span>
                <span className={`font-bold ${isDelayed ? 'text-[#F2B84B]' : 'text-[#42C76A]'}`}>
                  {varianceMin > 0 ? '+' : ''}{varianceMin} MIN {isDelayed ? 'DELAYED' : 'AHEAD'}
                </span>
              </div>
            </div>

            {/* Contextual AI Action */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => navigate(`/assist?question=${encodeURIComponent(`Why is ${taskTitle} currently predicted to take ${varianceMin > 0 ? '+' : ''}${varianceMin} minutes longer than scheduled?`)}`, { state: { autoSubmit: true } })}
                className="group flex flex-col lg:items-end gap-1 cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#FFCC00]">
                  <span>✦ ASK ASSIST</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">→</span>
                </div>
                <span className="font-mono text-sm tracking-widest text-[#929A9E] group-hover:text-[#F1F3F4] transition-colors uppercase">
                  Explain the {varianceMin > 0 ? '+' : ''}{varianceMin} min variance
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
