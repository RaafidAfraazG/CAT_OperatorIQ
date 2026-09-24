import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, TrendingUp, ClipboardList } from 'lucide-react';
import { api } from '../../api/client';
import { useDemoMode } from '../../context/DemoModeContext';

export default function DriveScreen() {
  const navigate = useNavigate();
  const { isDemoMode, demoState } = useDemoMode();

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
            api.getTasks({ operator_id: activeOp.operator_id }),
            api.getSafetyRisk(activeOp.operator_id).catch(() => null),
          ]);

          if (riskData) setSafetyRisk(riskData);

          if (tasksData.length > 0) {
            const activeTask = tasksData.find((t: any) => t.task_status === 'IN_PROGRESS' || t.task_status === 'DELAYED') || tasksData[0];
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

  // Telemetry: use demo values if demo mode is on, else fallback to backend
  const speed = isDemoMode ? demoState.telemetry.speed : (telemetry?.machine_speed_kmh ?? 4.8);
  const rpm = isDemoMode ? demoState.telemetry.rpm : (telemetry?.engine_rpm ?? 1820);
  const loadPct = isDemoMode ? demoState.telemetry.loadPct : (telemetry?.engine_load_percent ?? 74);
  const fuelRate = isDemoMode ? demoState.telemetry.fuelRate : (telemetry?.fuel_rate_lph ?? 22.4);
  const fuelLvl = isDemoMode ? demoState.telemetry.fuelLvl : (telemetry?.fuel_level_percent ?? 68);
  const hydPress = isDemoMode ? demoState.telemetry.hydPress : (telemetry?.hydraulic_pressure_bar ?? 245);

  // Task & ETA calculations
  const taskTitle = isDemoMode ? demoState.task.taskTitle : (task ? task.task_type.replace(/_/g, ' ') : 'EARTH EXCAVATION');
  const taskZone = isDemoMode ? demoState.task.taskZone : (task?.site_id ? `ZONE A • ${task.site_id}` : 'ZONE A • NORTH BENCH');
  const scheduledMin = isDemoMode ? demoState.task.scheduledMin : (task?.estimated_duration_min ?? 120);
  const predictedMin = isDemoMode ? demoState.task.predictedMin : (eta?.predicted_duration_min ?? 135);
  const varianceMin = isDemoMode ? demoState.task.varianceMin : (eta?.delay_minutes ?? (predictedMin - scheduledMin));
  const isDelayed = isDemoMode ? demoState.task.isDelayed : (eta ? eta.status === 'likely_delayed' : varianceMin > 0);
  const progressPct = isDemoMode ? Math.round(demoState.task.progressPct) : (task?.task_efficiency ? Math.round(task.task_efficiency * 100) : 72);
  const rawStatus = isDemoMode 
    ? (demoState.task.taskStatus || (isDelayed ? 'DELAYED' : 'IN PROGRESS'))
    : (task?.task_status ? task.task_status.replace(/_/g, ' ') : (isDelayed ? 'DELAYED' : 'IN PROGRESS'));
  const taskStatusText = rawStatus.toUpperCase();

  const seatbeltStatus = isDemoMode ? demoState.telemetry.seatbeltStatus : (telemetry?.seatbelt_status ?? 'FASTENED');
  const nearestPersonM = telemetry?.nearest_person_distance_m ?? null;
  const nearestVehicleM = telemetry?.nearest_vehicle_distance_m ?? null;
  const nearestObstacleM = telemetry?.nearest_obstacle_distance_m ?? null;

  // Determine proximity state
  const PROXIMITY_WARN_M = 5.0;
  const allDistances = [nearestPersonM, nearestVehicleM, nearestObstacleM].filter((d): d is number => d !== null);
  const backendNearestDistance = allDistances.length > 0 ? Math.min(...allDistances) : null;
  
  const nearestDistance = isDemoMode ? demoState.safety.nearestDistance : backendNearestDistance;
  const proximityState = isDemoMode 
    ? (demoState.safety.proximityState === 'CRITICAL' ? 'WARNING' : demoState.safety.proximityState)
    : (nearestDistance !== null ? (nearestDistance < PROXIMITY_WARN_M ? 'WARNING' : 'CLEAR') : 'CLEAR');
  const proximityColor = isDemoMode
    ? (demoState.safety.isCritical ? 'text-[#E5484D]' : demoState.safety.isCaution ? 'text-[#F2B84B]' : 'text-[#42C76A]')
    : (proximityState === 'WARNING' ? 'text-[#F2B84B]' : 'text-[#42C76A]');

  // Safety risk evaluation
  const riskLevel = isDemoMode ? demoState.safety.riskLevel : (safetyRisk?.risk_level || 'low');
  const riskScore = isDemoMode ? demoState.safety.riskScore : (safetyRisk?.risk_score ?? 15);
  const isCriticalSafety = isDemoMode ? demoState.safety.isCritical : (riskLevel === 'critical' || riskScore >= 80);

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
              <p className="text-sm text-[#080A0B]/80 mt-1">
                PROXIMITY HAZARD: GROUND WORKER WITHIN {nearestDistance !== null ? `${nearestDistance.toFixed(1)}M` : '4.2M'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/safety')}
            className="px-6 py-2 bg-[#080A0B] text-[#F1F3F4] text-sm uppercase font-extrabold cursor-pointer hover:bg-[#141819]"
          >
            VIEW RADAR
          </button>
        </div>
      )}

      {/* SINGLE SURFACE INSTRUMENT PANEL */}
      <div className="flex-1 min-h-0 flex flex-col justify-between px-8 py-4 lg:py-6 lg:px-12 max-w-[1600px] mx-auto w-full gap-4 lg:gap-6">
        
        {/* 1. UPPER: CURRENT OPERATION & TELEMETRY */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold tracking-widest text-[#929A9E] uppercase">
              CURRENT OPERATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#42C76A]" />
            <span className="font-mono text-xs font-bold tracking-widest text-[#FFCC00] uppercase">
              {taskTitle}
            </span>
          </div>
          <div className="font-mono text-xs tracking-widest text-[#5E676C] uppercase hidden sm:block">
            {machine?.machine_model || 'EX-140GC'} // CAB TELEMETRY
          </div>
        </div>

        <div className="w-full h-px bg-[#141819]" />

        {/* MIDDLE: MACHINE INSTRUMENTATION ROW (TELEMETRY) */}
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

        {/* 2. MIDDLE: COMPACT CURRENT TASK PANEL */}
        <div className="w-full bg-[#0D1012] border border-[#22282C] border-l-4 border-l-[#FFCC00] rounded px-6 py-4 lg:py-5 shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left Column: CURRENT TASK, Title, Zone */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span className="font-mono text-xs font-bold tracking-widest text-[#929A9E] uppercase">
                CURRENT TASK
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#F1F3F4] tracking-tight uppercase">
              {taskTitle}
            </h2>
            <p className="font-mono text-xs lg:text-sm tracking-widest text-[#FFCC00] font-semibold mt-1 uppercase">
              {taskZone}
            </p>
          </div>

          {/* Right Column: Progress %, ETA, Status */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 lg:gap-12">
            {/* Task Progress % */}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-0.5">
                PROGRESS
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl lg:text-3xl font-black text-[#F1F3F4] tracking-tight">
                  {progressPct}%
                </span>
                <span className="font-mono text-xs font-bold text-[#929A9E] uppercase tracking-wider">
                  COMPLETE
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="w-28 sm:w-36 h-1.5 bg-[#171B1D] rounded-full overflow-hidden mt-1.5 border border-[#2A3033]">
                <div 
                  className="h-full bg-[#FFCC00] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                />
              </div>
            </div>

            <div className="w-px h-10 bg-[#1A1F22] hidden sm:block" />

            {/* Predicted ETA */}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-0.5">
                PREDICTED ETA
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xs font-bold text-[#929A9E] uppercase tracking-wider">
                  ETA
                </span>
                <span className="font-mono text-2xl lg:text-3xl font-black text-[#F1F3F4] tracking-tight">
                  {predictedMin}
                </span>
                <span className="font-mono text-xs font-bold text-[#929A9E] uppercase tracking-wider">
                  MIN
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-wider uppercase mt-1 text-[#5E676C]">
                {isDelayed ? `+${varianceMin} MIN OVER` : 'ON SCHEDULE'}
              </span>
            </div>

            <div className="w-px h-10 bg-[#1A1F22] hidden sm:block" />

            {/* Task Status */}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mb-1">
                STATUS
              </span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#13171A] border border-[#262D32]">
                <span className={`w-2 h-2 rounded-full ${
                  taskStatusText.includes('COMPLETED')
                    ? 'bg-[#42C76A]'
                    : isDelayed || taskStatusText.includes('DELAYED')
                    ? 'bg-[#F2B84B] animate-pulse'
                    : 'bg-[#FFCC00] animate-pulse'
                }`} />
                <span className={`font-mono text-xs font-extrabold tracking-wider uppercase ${
                  taskStatusText.includes('COMPLETED')
                    ? 'text-[#42C76A]'
                    : isDelayed || taskStatusText.includes('DELAYED')
                    ? 'text-[#F2B84B]'
                    : 'text-[#FFCC00]'
                }`}>
                  {taskStatusText}
                </span>
              </div>
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
                <span className={`font-bold ${seatbeltStatus === 'UNFASTENED' ? 'text-[#E5484D]' : 'text-[#F1F3F4]'}`}>
                  {seatbeltStatus || 'FASTENED'}
                </span>
              </div>
              <div className="flex justify-between w-64 border-b border-[#141819] pb-2">
                <span className="text-[#929A9E]">NEAREST OBJECT</span>
                <span className={`font-bold ${nearestDistance !== null && nearestDistance < PROXIMITY_WARN_M ? 'text-[#F2B84B]' : 'text-[#42C76A]'}`}>
                  {nearestDistance !== null ? `${nearestDistance.toFixed(1)}m` : 'CLEAR'}
                </span>
              </div>
              <div className="flex justify-between w-64 border-b border-[#141819] pb-2">
                <span className="text-[#929A9E]">PROXIMITY</span>
                <span className={`font-bold ${proximityColor}`}>{proximityState}</span>
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
