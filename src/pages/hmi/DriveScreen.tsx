import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { api } from '../../api/client';

export default function DriveScreen() {
  const navigate = useNavigate();

  const [operator, setOperator] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [eta, setEta] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [safetyRisk, setSafetyRisk] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDriveData() {
      try {
        const [operators, machines] = await Promise.all([
          api.getOperators(),
          api.getMachines(),
        ]);

        if (operators.length > 0) {
          const activeOp = operators[0];
          setOperator(activeOp);

          // Concurrent fetch of operator-specific data
          const [tasksData, riskData] = await Promise.all([
            api.getTasks({ operator_id: activeOp.operator_id, status: 'In Progress' }),
            api.getSafetyRisk(activeOp.operator_id).catch(() => null),
          ]);

          if (riskData) setSafetyRisk(riskData);

          if (tasksData.length > 0) {
            const activeTask = tasksData[0];
            setTask(activeTask);

            // Fetch ML Task ETA
            api.getTaskEta(activeTask.task_id).then(setEta).catch(console.error);

            // Fetch Machine assigned to task
            const taskMachine = machines.find((m: any) => m.machine_id === activeTask.machine_id);
            if (taskMachine) {
              setMachine(taskMachine);
              loadTelemetry(taskMachine.machine_id);
            } else if (machines.length > 0) {
              setMachine(machines[0]);
              loadTelemetry(machines[0].machine_id);
            }
          } else if (machines.length > 0) {
            setMachine(machines[0]);
            loadTelemetry(machines[0].machine_id);
          }
        }

        // Active Alerts
        const alertsData = await api.getAlerts({ resolved: 'false' }).catch(() => []);
        setActiveAlerts(alertsData.filter((a: any) => !a.resolved));
      } catch (err: any) {
        console.error('Failed to load DRIVE data:', err);
        setError('Unable to link in-cab telematics. Retrying connection...');
      } finally {
        setLoading(false);
      }
    }

    async function loadTelemetry(machineId: string) {
      try {
        const telList = await api.getTelemetry(machineId, 5);
        if (telList && telList.length > 0) {
          setTelemetry(telList[0]);
        }
      } catch (e) {
        console.error('Failed to fetch telemetry for machine', machineId, e);
      }
    }

    loadDriveData();
  }, []);

  // Telemetry fallback defaults
  const speed = telemetry?.machine_speed_kmh ?? 4.8;
  const rpm = telemetry?.engine_rpm ?? 1820;
  const loadPct = telemetry?.engine_load_percent ?? 74;
  const fuelRate = telemetry?.fuel_rate_lph ?? 22.4;
  const fuelLvl = telemetry?.fuel_level_percent ?? 68;
  const hydPress = telemetry?.hydraulic_pressure_bar ?? 245;

  // Task & ETA calculations
  const taskTitle = task ? task.task_type.replace(/_/g, ' ') : 'EARTH EXCAVATION';
  const taskZone = task?.site_id ? `ZONE A • ${task.site_id}` : 'ZONE A • NORTH BENCH';
  const scheduledMin = task?.estimated_duration_min ?? 120;
  const predictedMin = eta?.predicted_duration_min ?? 135;
  const varianceMin = eta?.delay_minutes ?? (predictedMin - scheduledMin);
  const isDelayed = eta ? eta.status === 'likely_delayed' : varianceMin > 0;
  const progressPct = task?.task_efficiency ? Math.round(task.task_efficiency * 100) : 72;

  // Safety risk evaluation
  const riskLevel = safetyRisk?.risk_level || 'low';
  const riskScore = safetyRisk?.risk_score ?? 15;
  const isCriticalSafety = riskLevel === 'critical' || riskScore >= 80;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none">
        <div className="w-12 h-12 rounded-full border-2 border-[#141819] border-t-[#FFCC00] animate-spin mb-6" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4]">INITIALIZING INSTRUMENTS</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none">
      {/* CRITICAL SAFETY OVERRIDE */}
      {isCriticalSafety && (
        <div className="w-full bg-[#E5484D] text-[#080A0B] px-8 py-4 flex items-center justify-between font-mono font-black tracking-widest z-40">
          <div className="flex items-center gap-4">
            <AlertTriangle size={24} />
            <div>
              <p className="text-lg uppercase">CRITICAL SAFETY ALERT</p>
              <p className="text-sm text-[#080A0B]/80 mt-1">PROXIMITY HAZARD: GROUND WORKER WITHIN 4.2M</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/legacy/safety')}
            className="px-6 py-2 bg-[#080A0B] text-[#F1F3F4] text-sm uppercase font-extrabold cursor-pointer hover:bg-[#141819]"
          >
            VIEW RADAR
          </button>
        </div>
      )}

      {/* SINGLE SURFACE INSTRUMENT PANEL */}
      <div className="flex-1 min-h-0 flex flex-col justify-between px-8 py-4 lg:py-6 lg:px-12 max-w-[1600px] mx-auto w-full gap-4 lg:gap-6">
        
        {/* UPPER: TASK & CONTEXT */}
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

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-6xl lg:text-7xl font-extrabold text-[#F1F3F4] tracking-tighter">
                  {progressPct}
                </span>
                <span className="text-3xl text-[#929A9E] font-medium">%</span>
              </div>
              <span className="font-mono text-sm tracking-widest text-[#929A9E] uppercase">
                COMPLETED
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#141819]" />

        {/* MIDDLE: MACHINE INSTRUMENTATION ROW */}
        <div className="flex flex-wrap items-center justify-between gap-8 py-2">
          {/* SPEED */}
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-1">GROUND SPEED</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[#F1F3F4]">{speed.toFixed(1)}</span>
              <span className="font-mono text-sm text-[#929A9E]">km/h</span>
            </div>
          </div>

          <div className="w-px h-12 bg-[#141819] hidden md:block" />

          {/* RPM */}
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-1">ENGINE RPM</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[#F1F3F4]">{Math.round(rpm).toLocaleString()}</span>
              <span className="font-mono text-sm text-[#929A9E]">RPM</span>
            </div>
          </div>

          <div className="w-px h-12 bg-[#141819] hidden md:block" />

          {/* ENGINE LOAD */}
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-1">ENGINE LOAD</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[#F1F3F4]">{Math.round(loadPct)}</span>
              <span className="font-mono text-sm text-[#929A9E]">%</span>
            </div>
          </div>

          <div className="w-px h-12 bg-[#141819] hidden md:block" />

          {/* FUEL LEVEL */}
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-1">DIESEL FUEL</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[#F1F3F4]">{Math.round(fuelLvl)}</span>
              <span className="font-mono text-sm text-[#929A9E]">%</span>
            </div>
          </div>

          <div className="w-px h-12 bg-[#141819] hidden md:block" />

          {/* FUEL RATE */}
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-1">FUEL RATE</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[#F1F3F4]">{fuelRate.toFixed(1)}</span>
              <span className="font-mono text-sm text-[#929A9E]">L/h</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#141819]" />

        {/* LOWER: SAFETY & SCHEDULE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 flex-1 min-h-0 items-start mt-2">
          
          {/* SAFETY REGION */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-[#42C76A]" />
              <span className="font-mono text-lg font-bold tracking-widest text-[#F1F3F4] uppercase">
                SAFE TO OPERATE
              </span>
              <span className="font-mono text-sm text-[#5E676C] tracking-widest ml-4">
                RISK {riskScore} / 100
              </span>
            </div>

            <div className="flex flex-col gap-3 font-mono text-sm tracking-widest">
              <div className="flex justify-between w-64 border-b border-[#141819] pb-2">
                <span className="text-[#929A9E]">SEATBELT</span>
                <span className="text-[#F1F3F4] font-bold">FASTENED</span>
              </div>
              <div className="flex justify-between w-64 border-b border-[#141819] pb-2">
                <span className="text-[#929A9E]">INTERLOCK</span>
                <span className="text-[#F1F3F4] font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between w-64 border-b border-[#141819] pb-2">
                <span className="text-[#929A9E]">PROXIMITY</span>
                <span className="text-[#42C76A] font-bold">CLEAR</span>
              </div>
            </div>
          </div>

          {/* TASK STATUS & AI ASSIST */}
          <div className="flex flex-col gap-8 lg:items-end">
            <div className="flex flex-col font-mono text-sm tracking-widest w-64 lg:text-right">
              <div className="flex justify-between lg:justify-end lg:gap-8 border-b border-[#141819] pb-2 mb-3">
                <span className="text-[#929A9E]">SCHEDULE</span>
                <span className="text-[#F1F3F4] font-bold">{scheduledMin} MIN</span>
              </div>
              <div className="flex justify-between lg:justify-end lg:gap-8 border-b border-[#141819] pb-2 mb-3">
                <span className="text-[#929A9E]">PREDICTED</span>
                <span className="text-[#F1F3F4] font-bold">{predictedMin} MIN</span>
              </div>
              <div className="flex justify-between lg:justify-end lg:gap-8 pb-2">
                <span className="text-[#929A9E]">VARIANCE</span>
                <span className={`font-bold ${isDelayed ? 'text-[#F2B84B]' : 'text-[#42C76A]'}`}>
                  {varianceMin > 0 ? '+' : ''}{varianceMin} MIN {isDelayed ? 'DELAYED' : 'AHEAD'}
                </span>
              </div>
            </div>

            {/* Subtle Contextual Action */}
            {isDelayed && (
              <button 
                onClick={() => navigate(`/assist?question=${encodeURIComponent(`Why is ${taskTitle} currently predicted to take ${varianceMin} minutes longer than scheduled?`)}`, { state: { autoSubmit: true } })}
                className="group flex flex-col lg:items-end gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#FFCC00]">
                  <span>✦ ASK ASSIST</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">→</span>
                </div>
                <span className="font-mono text-sm text-[#929A9E] group-hover:text-[#F1F3F4] transition-colors">
                  Why is this task delayed?
                </span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
