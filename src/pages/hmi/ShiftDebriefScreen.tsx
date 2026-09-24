import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';

export default function ShiftDebriefScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string>('');
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [fuelData, setFuelData] = useState<any>(null);
  const [safetyAlertCount, setSafetyAlertCount] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const ops = await api.getOperators();
        if (!ops || ops.length === 0) return;
        const op = ops[0];
        const opId = op.operator_id;
        setOperatorId(opId);

        const [tasksRes, intelRes, alertsRes, machinesRes] = await Promise.allSettled([
          api.getTasks({ operator_id: opId }),
          api.getOperatorIntelligence(opId),
          api.getAlerts({ resolved: 'false' }),
          api.getMachines()
        ]);

        let operatorTasks: any[] = [];
        if (tasksRes.status === 'fulfilled') {
          operatorTasks = tasksRes.value;
          // Show most recent tasks for debrief (all statuses)
          setTasks(operatorTasks.slice(0, 8));
        }
        if (intelRes.status === 'fulfilled') {
          setIntelligence(intelRes.value);
        }
        if (alertsRes.status === 'fulfilled') {
          // Count safety-related alerts for this operator
          const safetyAlerts = alertsRes.value.filter(
            (a: any) => a.operator_id === opId &&
              ['PROXIMITY', 'SEATBELT_VIOLATION', 'OVERSPEED'].includes(a.alert_type)
          );
          setSafetyAlertCount(safetyAlerts.length);
        }
        // Load fuel anomaly from the operator's machine
        if (machinesRes.status === 'fulfilled' && machinesRes.value.length > 0) {
          // Try to find machine linked to operator via intelligence
          const machineId = intelRes.status === 'fulfilled'
            ? intelRes.value?.machine?.machine_id || machinesRes.value[0].machine_id
            : machinesRes.value[0].machine_id;
          const fuelRes = await api.getFuelAnomaly(machineId).catch(() => null);
          if (fuelRes) setFuelData(fuelRes);
        }

      } catch (err) {
        console.error('Failed to load shift debrief data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none overflow-hidden">
        <div className="w-12 h-12 rounded-full border-2 border-[#141819] border-t-[#FFCC00] animate-spin mb-6" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4]">GENERATING SHIFT REPORT</p>
      </div>
    );
  }

  // Compute real metrics from DB data
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.task_status === 'COMPLETED').length;
  const delayedTasks = tasks.filter(t => t.task_status === 'DELAYED').length;

  // Compute shift duration from actual task durations
  const totalActualMin = tasks.reduce((sum: number, t: any) => sum + (t.actual_duration_min || t.estimated_duration_min || 0), 0);
  const shiftHrs = (totalActualMin / 60).toFixed(1);
  const shiftDuration = totalActualMin > 0 ? `${shiftHrs} HRS` : 'N/A';

  // Fuel metrics from ML fuel anomaly
  const actualFuelRate = fuelData?.actual_fuel_rate ?? null;
  const expectedFuelRate = fuelData?.expected_fuel_rate ?? null;
  const fuelDeviation = fuelData?.deviation_percent ?? null;
  const idleFuel = fuelData?.idle_fuel ?? null;

  const aiInsights = intelligence?.insights || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none">
      
      <div className="flex-1 min-h-0 flex flex-col px-8 py-4 lg:py-6 lg:px-12 max-w-[1600px] mx-auto w-full gap-4 lg:gap-6">
        
        {/* UPPER: HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 shrink-0">
          <div>
            <span className="font-mono text-xs font-bold tracking-widest text-[#929A9E] uppercase flex items-center gap-2">
              <Clock size={14} /> SHIFT REPORT
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#F1F3F4] tracking-tight mt-2 uppercase">
              DEBRIEF SUMMARY
            </h1>
            <p className="font-mono text-sm tracking-widest text-[#FFCC00] mt-3 uppercase">
              SHIFT ENDED 15 MIN AGO
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-6xl lg:text-7xl font-extrabold text-[#F1F3F4] tracking-tighter">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <span className="font-mono text-sm tracking-widest text-[#929A9E] uppercase">
                TASKS COMPLETED
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#141819] shrink-0" />

        {/* MIDDLE / LOWER: CONTENT REGION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 flex-1 min-h-0 items-start mt-2">
          
          {/* LEFT: PERFORMANCE & METRICS */}
          <div className="flex flex-col gap-6 h-full min-h-0 pr-2">
            <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
              PERFORMANCE METRICS
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col border border-[#141819] p-4 bg-[#0D1011]">
                <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase font-bold mb-2">
                  TOTAL DURATION
                </span>
                <span className="font-mono text-3xl font-extrabold text-[#F1F3F4]">{shiftDuration}</span>
                <span className="font-mono text-xs text-[#929A9E] mt-2">{delayedTasks > 0 ? `${delayedTasks} DELAYED` : 'ON SCHEDULE'}</span>
              </div>
              <div className="flex flex-col border border-[#141819] p-4 bg-[#0D1011]">
                <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase font-bold mb-2">
                  FUEL RATE
                </span>
                <span className="font-mono text-3xl font-extrabold text-[#F1F3F4]">
                  {actualFuelRate !== null ? `${actualFuelRate}` : '—'}
                  <span className="text-sm font-normal text-[#929A9E]"> L/H</span>
                </span>
                <span className={`font-mono text-xs mt-2 ${fuelDeviation !== null && fuelDeviation > 10 ? 'text-[#E5484D]' : 'text-[#42C76A]'}`}>
                  {fuelDeviation !== null ? `${fuelDeviation > 0 ? '+' : ''}${fuelDeviation}% VARIANCE` : expectedFuelRate !== null ? `BASELINE ${expectedFuelRate} L/H` : 'LOADING...'}
                </span>
              </div>
              <div className="flex flex-col border border-[#141819] p-4 bg-[#0D1011]">
                <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase font-bold mb-2">
                  IDLE FUEL WASTE
                </span>
                <span className="font-mono text-3xl font-extrabold text-[#F1F3F4]">
                  {idleFuel !== null ? idleFuel.toFixed(1) : '—'}
                  <span className="text-sm font-normal text-[#929A9E]"> L</span>
                </span>
                <span className={`font-mono text-xs mt-2 ${idleFuel !== null && idleFuel > 5 ? 'text-[#E5484D]' : 'text-[#42C76A]'}`}>
                  {idleFuel !== null ? (idleFuel > 5 ? 'ABOVE NORMAL' : 'WITHIN RANGE') : 'LOADING...'}
                </span>
              </div>
              <div className="flex flex-col border border-[#141819] p-4 bg-[#0D1011]">
                <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase font-bold mb-2">
                  SAFETY ALERTS
                </span>
                <span className="font-mono text-3xl font-extrabold text-[#F1F3F4]">{safetyAlertCount}</span>
                <span className={`font-mono text-xs mt-2 ${safetyAlertCount > 0 ? 'text-[#F2B84B]' : 'text-[#42C76A]'}`}>
                  {safetyAlertCount > 0 ? 'PROXIMITY / VIOLATIONS' : 'NO SAFETY ALERTS'}
                </span>
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 border border-[#141819] p-4 bg-[#0D1011] mt-2 overflow-y-auto scrollbar-thin">
              <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase font-bold mb-4">
                TASK BREAKDOWN
              </span>
              <div className="flex flex-col gap-3">
                {tasks.length > 0 ? tasks.map((task, idx) => (
                  <div key={idx} className="flex justify-between items-center font-mono text-xs tracking-widest uppercase pb-2 border-b border-[#141819] last:border-0 last:pb-0">
                    <span className="text-[#F1F3F4]">{task.task_type.replace(/_/g, ' ')}</span>
                    <span className={task.task_status === 'COMPLETED' ? 'text-[#42C76A]' : task.task_status === 'DELAYED' ? 'text-[#F2B84B]' : 'text-[#929A9E]'}>{task.task_status.replace(/_/g, ' ')}</span>
                  </div>
                )) : (
                  <span className="font-mono text-xs text-[#5E676C] uppercase tracking-widest">NO TASK DATA AVAILABLE</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: AI INTELLIGENCE */}
          <div className="flex flex-col gap-6 h-full min-h-0">
            <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
              OPERATOR INTELLIGENCE BRIEFING
            </span>
            
            <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin flex-1 min-h-0 pr-2">
              {aiInsights.length > 0 ? (
                aiInsights.map((insight: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 p-4 border border-[#FFCC00]/30 bg-[#FFCC00]/5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={12} className="text-[#FFCC00]" />
                      <span className="font-mono text-xs font-bold text-[#FFCC00] uppercase tracking-widest">
                        {insight.severity} INSIGHT
                      </span>
                    </div>
                    <span className="font-mono text-sm text-[#F1F3F4] leading-relaxed">
                      {insight.message}
                    </span>
                    <span className="font-mono text-xs text-[#929A9E] mt-2">
                      Source: {insight.source}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-[#141819] bg-[#0D1011]">
                  <span className="font-mono text-sm text-[#929A9E] tracking-widest uppercase">
                    NO INTELLIGENCE INSIGHTS GENERATED FOR THIS SHIFT.
                  </span>
                </div>
              )}
            </div>

            {/* Contextual Action */}
            <div className="mt-auto flex justify-end shrink-0 pt-4">
              <button 
                onClick={() => navigate('/assist?question=' + encodeURIComponent('Summarize my performance this shift and suggest one area for improvement.'), { state: { autoSubmit: true } })}
                className="group flex flex-col items-end gap-1 cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#FFCC00]">
                  <span>✦ ASK ASSIST</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">→</span>
                </div>
                <span className="font-mono text-sm tracking-widest text-[#929A9E] group-hover:text-[#F1F3F4] transition-colors uppercase">
                  Explain my shift summary
                </span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
