import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// ============================================================================
// Demo Mode & Real-time Telemetry Simulation Engine
// Shared singleton context providing realistic, continuously evolving telemetry
// across Drive, Machine, Safety, Work, Shift Debrief, and AI Assistant.
// ============================================================================

export interface SimulatedTelemetry {
  speed: number;             // km/h (e.g. 4.8)
  rpm: number;               // RPM (e.g. 1820)
  loadPct: number;           // % (e.g. 74)
  fuelLvl: number;           // % (e.g. 67.8)
  fuelRate: number;          // L/h (e.g. 22.4)
  coolantTemp: number;       // °C (e.g. 82)
  hydPress: number;          // bar (e.g. 245)
  operatingState: 'DIGGING' | 'SWING_DUMP' | 'HAUL_TRAVEL' | 'IDLE_WAIT';
  idleRatio: number;         // % (e.g. 16.5)
  seatbeltStatus: string;    // 'FASTENED'
}

export interface SimulatedTask {
  taskId: string;
  taskTitle: string;
  taskZone: string;
  progressPct: number;       // e.g. 72.4% -> 73.1%
  scheduledMin: number;      // e.g. 120
  predictedMin: number;      // e.g. 135
  varianceMin: number;       // e.g. 15
  isDelayed: boolean;        // true
  taskStatus: string;        // 'IN_PROGRESS'
}

export interface ProximityObject {
  id: string;
  label: string;
  type: 'worker' | 'vehicle' | 'obstacle';
  initX: number;
  initY: number;
  currentX: number;
  currentY: number;
  distanceM: number;
  status: 'safe' | 'warning' | 'critical';
  angle: number;
  _dx: number;
  _dy: number;
}

export interface SimulatedAlert {
  alert_id: string;
  alert_type: string;
  severity: string;
  message: string;
  resolved: boolean;
  timestamp: string;
}

export interface SimulatedSafety {
  objects: ProximityObject[];
  nearestDistance: number;
  nearestObject: ProximityObject;
  proximityState: 'CLEAR' | 'WARNING' | 'CRITICAL';
  proximityColor: string;
  riskScore: number;         // 15 -> 88 during breach
  riskLevel: 'low' | 'moderate' | 'critical';
  isCritical: boolean;
  isCaution: boolean;
  globalStateText: string;   // 'SAFE TO OPERATE' | 'CAUTION' | 'CRITICAL HAZARD'
  globalStateColor: string;
  seatbeltStatus: string;
  activeAlerts: SimulatedAlert[];
  recentEvents: Array<{
    event_id: string;
    event_type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface TelemetryHistoryPoint {
  timestamp: string;
  engineRpm: number;
  loadPct: number;
  fuelRate: number;
  speed: number;
}

export interface SimulatedShiftDebrief {
  shiftDuration: string;     // "4.4 HRS"
  completedTasks: number;    // 4
  totalTasks: number;        // 6
  delayedTasks: number;      // 1
  actualFuelRate: number;    // 18.2
  expectedFuelRate: number;  // 16.5
  fuelDeviation: number;     // 10.3
  idleFuel: number;          // 6.2
  safetyAlertCount: number;  // 1
  taskBreakdown: Array<{
    task_type: string;
    task_status: string;
  }>;
}

export interface DemoState {
  telemetry: SimulatedTelemetry;
  task: SimulatedTask;
  safety: SimulatedSafety;
  history: TelemetryHistoryPoint[];
  shiftDebrief: SimulatedShiftDebrief;
  tickCount: number;
}

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (active: boolean) => void;
  demoState: DemoState;
  manualMachineY: number;
  setManualMachineY: React.Dispatch<React.SetStateAction<number>>;
  moveMachineUp: () => void;
  moveMachineDown: () => void;
}

// ─── Proximity Initial Definitions ──────────────────────────────────────────
const DEMO_PX_PER_M = 10;
const PROXIMITY_DANGER_M = 8.0;
const PROXIMITY_WARN_M = 12.0;

const BASE_OBJECTS = [
  { id: 'worker-1', label: 'WORKER', type: 'worker' as const, initX: -80, initY: 140, angleOffset: 220 },
  { id: 'truck-1', label: 'HAUL TRUCK', type: 'vehicle' as const, initX: 110, initY: -110, angleOffset: 45 },
  { id: 'edge-1', label: 'EDGE', type: 'obstacle' as const, initX: 130, initY: 120, angleOffset: 135 },
  { id: 'worker-2', label: 'WORKER', type: 'worker' as const, initX: -70, initY: -90, angleOffset: 300 },
];

function buildInitialHistory(): TelemetryHistoryPoint[] {
  const points: TelemetryHistoryPoint[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now - i * 2000);
    // Realistic initial variation around 1740-1820 RPM
    const sineVal = Math.sin(i * 0.4);
    points.push({
      timestamp: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      engineRpm: Math.round(1760 + sineVal * 90),
      loadPct: Math.round(72 + sineVal * 12),
      fuelRate: Number((21.4 + sineVal * 3.2).toFixed(1)),
      speed: Number(Math.max(0, 3.8 + sineVal * 1.5).toFixed(1)),
    });
  }
  return points;
}

const initialDemoState: DemoState = {
  telemetry: {
    speed: 4.8,
    rpm: 1820,
    loadPct: 74,
    fuelLvl: 67.8,
    fuelRate: 22.4,
    coolantTemp: 82,
    hydPress: 245,
    operatingState: 'DIGGING',
    idleRatio: 16.5,
    seatbeltStatus: 'FASTENED',
  },
  task: {
    taskId: 'T-DEMO-101',
    taskTitle: 'EARTH EXCAVATION',
    taskZone: 'ZONE A • NORTH BENCH',
    progressPct: 72.4,
    scheduledMin: 120,
    predictedMin: 135,
    varianceMin: 15,
    isDelayed: true,
    taskStatus: 'IN_PROGRESS',
  },
  safety: {
    objects: [],
    nearestDistance: 11.4,
    nearestObject: null as any,
    proximityState: 'CLEAR',
    proximityColor: 'text-[#42C76A]',
    riskScore: 15,
    riskLevel: 'low',
    isCritical: false,
    isCaution: false,
    globalStateText: 'SAFE TO OPERATE',
    globalStateColor: 'text-[#42C76A]',
    seatbeltStatus: 'FASTENED',
    activeAlerts: [],
    recentEvents: [
      {
        event_id: 'ev-1',
        event_type: 'PRE-SHIFT INSPECTION',
        description: 'ALL SAFETY SYSTEMS VERIFIED ONLINE',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        event_id: 'ev-2',
        event_type: 'SEATBELT ENGAGED',
        description: 'PRIMARY RESTRAINT LATCH CONFIRMED',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      }
    ],
  },
  history: buildInitialHistory(),
  shiftDebrief: {
    shiftDuration: '4.4 HRS',
    completedTasks: 4,
    totalTasks: 6,
    delayedTasks: 1,
    actualFuelRate: 18.2,
    expectedFuelRate: 16.5,
    fuelDeviation: 10.3,
    idleFuel: 6.2,
    safetyAlertCount: 0,
    taskBreakdown: [
      { task_type: 'EARTH EXCAVATION', task_status: 'IN PROGRESS' },
      { task_type: 'OVERBURDEN STRIPPING', task_status: 'COMPLETED' },
      { task_type: 'TRENCHING SECTOR 4', task_status: 'COMPLETED' },
      { task_type: 'MATERIAL HAUL', task_status: 'COMPLETED' },
      { task_type: 'ROAD GRADING', task_status: 'COMPLETED' },
      { task_type: 'BENCH CLEARING', task_status: 'QUEUED' },
    ],
  },
  tickCount: 0,
};

const DemoModeContext = createContext<DemoModeContextType | null>(null);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('operatoriq_demo_mode') === 'true';
  });

  const [demoState, setDemoState] = useState<DemoState>(initialDemoState);
  const [manualMachineY, setManualMachineY] = useState<number>(0);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev;
      localStorage.setItem('operatoriq_demo_mode', String(next));
      return next;
    });
  };

  const setDemoMode = (active: boolean) => {
    localStorage.setItem('operatoriq_demo_mode', String(active));
    setIsDemoMode(active);
  };

  const moveMachineUp = () => setManualMachineY(y => y - 15);
  const moveMachineDown = () => setManualMachineY(y => y + 15);

  // Simulation tick loop (runs continuously when isDemoMode is active)
  const stateRef = useRef(demoState);
  stateRef.current = demoState;

  const machineYRef = useRef(manualMachineY);
  machineYRef.current = manualMachineY;

  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      setDemoState(prev => {
        const nextTick = prev.tickCount + 1;

        // 1. Operating Cycle (Loop every 32 ticks ≈ 48 seconds at 1.5s/tick)
        // 0-11: DIGGING (high load & pressure, low speed)
        // 12-19: SWING_DUMP (moderate load, zero speed)
        // 20-27: HAUL_TRAVEL (moderate-high speed, moderate load)
        // 28-31: IDLE_WAIT (low RPM, idle load, zero speed)
        const cycleStep = nextTick % 32;

        let targetState: 'DIGGING' | 'SWING_DUMP' | 'HAUL_TRAVEL' | 'IDLE_WAIT' = 'DIGGING';
        let targetRpm = 1820;
        let targetLoad = 78;
        let targetSpeed = 0.4;
        let targetHydPress = 255;
        let targetFuelRate = 23.2;

        if (cycleStep < 12) {
          targetState = 'DIGGING';
          targetRpm = 1840 + Math.sin(nextTick * 0.8) * 45;
          targetLoad = 82 + Math.cos(nextTick * 0.7) * 7;
          targetSpeed = Math.max(0, 0.4 + Math.sin(nextTick) * 0.3);
          targetHydPress = 262 + Math.sin(nextTick * 0.9) * 12;
          targetFuelRate = 22.8 + (targetLoad / 100) * 3.5;
        } else if (cycleStep < 20) {
          targetState = 'SWING_DUMP';
          targetRpm = 1620 + Math.cos(nextTick * 0.6) * 35;
          targetLoad = 55 + Math.sin(nextTick * 0.7) * 5;
          targetSpeed = 0.0;
          targetHydPress = 215 + Math.cos(nextTick * 0.5) * 8;
          targetFuelRate = 16.2 + (targetLoad / 100) * 2.2;
        } else if (cycleStep < 28) {
          targetState = 'HAUL_TRAVEL';
          targetRpm = 1580 + Math.sin(nextTick * 0.5) * 40;
          targetLoad = 66 + Math.cos(nextTick * 0.4) * 6;
          targetSpeed = 4.8 + Math.sin(nextTick * 0.6) * 1.4;
          targetHydPress = 188 + Math.sin(nextTick * 0.4) * 10;
          targetFuelRate = 18.5 + (targetLoad / 100) * 2.5;
        } else {
          targetState = 'IDLE_WAIT';
          targetRpm = 920 + Math.sin(nextTick) * 15;
          targetLoad = 22 + Math.cos(nextTick) * 3;
          targetSpeed = 0.0;
          targetHydPress = 105 + Math.sin(nextTick) * 5;
          targetFuelRate = 6.4 + Math.cos(nextTick) * 0.4;
        }

        // Smooth bounded Lerp (avoid abrupt jumping)
        const lerpFactor = 0.3;
        const newRpm = prev.telemetry.rpm + (targetRpm - prev.telemetry.rpm) * lerpFactor;
        const newLoad = prev.telemetry.loadPct + (targetLoad - prev.telemetry.loadPct) * lerpFactor;
        const newSpeed = Math.max(0, prev.telemetry.speed + (targetSpeed - prev.telemetry.speed) * lerpFactor);
        const newHydPress = prev.telemetry.hydPress + (targetHydPress - prev.telemetry.hydPress) * lerpFactor;
        const newFuelRate = prev.telemetry.fuelRate + (targetFuelRate - prev.telemetry.fuelRate) * lerpFactor;

        // Realistic slow fuel depletion (-0.01% every 6 ticks)
        const fuelDrain = nextTick % 6 === 0 ? 0.01 : 0.0;
        const newFuelLvl = Math.max(10, Number((prev.telemetry.fuelLvl - fuelDrain).toFixed(2)));

        // Coolant temperature: gently adjusts with load between 81°C and 86°C
        const targetCoolant = 80 + (newLoad / 100) * 6;
        const newCoolant = prev.telemetry.coolantTemp + (targetCoolant - prev.telemetry.coolantTemp) * 0.1;

        // Idle ratio adjustment
        const newIdleRatio = targetState === 'IDLE_WAIT' 
          ? Math.min(25, prev.telemetry.idleRatio + 0.05) 
          : Math.max(14, prev.telemetry.idleRatio - 0.01);

        // 2. Task Progress & Schedule / ETA Simulation
        // Progress advances +0.1% every 2 ticks
        const newProgress = Math.min(98.5, Number((prev.task.progressPct + (nextTick % 2 === 0 ? 0.1 : 0)).toFixed(1)));
        
        // Dynamic predicted duration with slight variance drift (+13 to +16 min)
        const varianceDrift = Math.round(14 + Math.sin(nextTick * 0.15) * 2);
        const newPredictedMin = prev.task.scheduledMin + varianceDrift;

        // 3. Proximity Simulation & Autonomous Intrusion Scenario
        // Worker-1 moves inward on ticks 14 to 24 of each 32-tick cycle (breaching the 8.0m boundary)
        // and retreats to safe patrol position on ticks 24 to 30.
        let worker1X = -80;
        let worker1Y = 140;

        if (cycleStep >= 13 && cycleStep < 18) {
          // Ingress: moving toward machine
          const progress = (cycleStep - 13) / 5; // 0.0 -> 1.0
          worker1X = -80 + progress * 55; // -80 -> -25
          worker1Y = 140 - progress * 95; // 140 -> 45
        } else if (cycleStep >= 18 && cycleStep < 24) {
          // Danger zone breach (inside 8m boundary: dx=-25, dy=42 => distance ~4.8m)
          worker1X = -25 + Math.sin(nextTick * 0.5) * 4;
          worker1Y = 42 + Math.cos(nextTick * 0.5) * 4;
        } else if (cycleStep >= 24 && cycleStep < 29) {
          // Egress: retreating safely
          const progress = (cycleStep - 24) / 5; // 0.0 -> 1.0
          worker1X = -25 - progress * 55; // -25 -> -80
          worker1Y = 42 + progress * 98; // 42 -> 140
        } else {
          // Patrol at safe distance
          worker1X = -80 + Math.sin(nextTick * 0.2) * 5;
          worker1Y = 140 + Math.cos(nextTick * 0.2) * 5;
        }

        // Recalculate proximity objects with current positions + manualMachineY offset
        const currentMachineY = machineYRef.current;
        const updatedObjects: ProximityObject[] = BASE_OBJECTS.map(obj => {
          let ox = obj.initX;
          let oy = obj.initY;

          if (obj.id === 'worker-1') {
            ox = worker1X;
            oy = worker1Y;
          }

          const dx = ox;
          const dy = oy - currentMachineY;
          const distPx = Math.sqrt(dx * dx + dy * dy);
          const distM = Number((distPx / DEMO_PX_PER_M).toFixed(1));

          let angle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
          if (angle < 0) angle += 360;

          const OBJECT_RADIUS_M = 0.6;
          let status: 'safe' | 'warning' | 'critical' = 'safe';
          if (distM <= PROXIMITY_DANGER_M + OBJECT_RADIUS_M) {
            status = 'critical';
          } else if (distM <= PROXIMITY_WARN_M) {
            status = 'warning';
          }

          return {
            ...obj,
            currentX: ox,
            currentY: oy,
            distanceM: distM,
            status,
            angle,
            _dx: dx,
            _dy: dy,
          };
        });

        // Find nearest hazard
        const sortedObjects = [...updatedObjects].sort((a, b) => a.distanceM - b.distanceM);
        const nearestObj = sortedObjects[0];
        const minDistance = nearestObj.distanceM;

        const hasCritical = updatedObjects.some(o => o.status === 'critical');
        const hasWarning = !hasCritical && updatedObjects.some(o => o.status === 'warning');

        // Dynamic risk score calculation
        let riskScore = 15;
        let riskLevel: 'low' | 'moderate' | 'critical' = 'low';

        if (hasCritical) {
          // Scale from 82 to 94 based on proximity depth
          riskScore = Math.round(82 + Math.max(0, (PROXIMITY_DANGER_M + 0.6 - minDistance) / 8.6) * 12);
          riskLevel = 'critical';
        } else if (hasWarning) {
          riskScore = Math.round(48 + Math.max(0, (PROXIMITY_WARN_M - minDistance) / 4.0) * 26);
          riskLevel = 'moderate';
        }

        const isCrit = riskLevel === 'critical';
        const isCaut = riskLevel === 'moderate';
        const stateText = isCrit ? 'CRITICAL HAZARD' : isCaut ? 'CAUTION' : 'SAFE TO OPERATE';
        const stateColor = isCrit ? 'text-[#E5484D]' : isCaut ? 'text-[#F2B84B]' : 'text-[#42C76A]';
        const proxState = isCrit ? 'CRITICAL' : isCaut ? 'WARNING' : 'CLEAR';
        const proxColor = isCrit ? 'text-[#E5484D]' : isCaut ? 'text-[#F2B84B]' : 'text-[#42C76A]';

        // Manage active alerts
        const activeAlerts: SimulatedAlert[] = [];
        if (isCrit) {
          activeAlerts.push({
            alert_id: 'alt-sim-crit',
            alert_type: 'PROXIMITY_HAZARD',
            severity: 'CRITICAL',
            message: `GROUND WORKER WITHIN ${minDistance.toFixed(1)}M OF MACHINE`,
            resolved: false,
            timestamp: new Date().toISOString(),
          });
        }
        if (newLoad > 85) {
          activeAlerts.push({
            alert_id: 'alt-sim-load',
            alert_type: 'HIGH_LOAD_SPIKE',
            severity: 'WARNING',
            message: `TRANSIENT ENGINE LOAD EXCEEDED 85% (${Math.round(newLoad)}%)`,
            resolved: false,
            timestamp: new Date().toISOString(),
          });
        }

        // 4. Rolling Telemetry History
        const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newHistoryPoint: TelemetryHistoryPoint = {
          timestamp: nowTimeStr,
          engineRpm: Math.round(newRpm),
          loadPct: Math.round(newLoad),
          fuelRate: Number(newFuelRate.toFixed(1)),
          speed: Number(newSpeed.toFixed(1)),
        };

        const updatedHistory = [...prev.history.slice(1), newHistoryPoint];

        // 5. Shift Debrief Derived Metrics
        const baseShiftHours = 4.3 + (nextTick * 1.5) / 3600;
        const debriefFuelRate = Number((prev.shiftDebrief.actualFuelRate * 0.95 + newFuelRate * 0.05).toFixed(1));
        const debriefDeviation = Number((((debriefFuelRate - 16.5) / 16.5) * 100).toFixed(1));
        const accumulatedIdle = Number((prev.shiftDebrief.idleFuel + (targetState === 'IDLE_WAIT' ? 0.005 : 0)).toFixed(1));
        const alertCount = isCrit ? Math.max(1, prev.shiftDebrief.safetyAlertCount) : prev.shiftDebrief.safetyAlertCount;

        return {
          telemetry: {
            speed: Number(newSpeed.toFixed(1)),
            rpm: Math.round(newRpm),
            loadPct: Math.round(newLoad),
            fuelLvl: newFuelLvl,
            fuelRate: Number(newFuelRate.toFixed(1)),
            coolantTemp: Math.round(newCoolant),
            hydPress: Math.round(newHydPress),
            operatingState: targetState,
            idleRatio: Number(newIdleRatio.toFixed(1)),
            seatbeltStatus: 'FASTENED',
          },
          task: {
            ...prev.task,
            progressPct: newProgress,
            predictedMin: newPredictedMin,
            varianceMin: varianceDrift,
            isDelayed: varianceDrift > 0,
          },
          safety: {
            objects: updatedObjects,
            nearestDistance: minDistance,
            nearestObject: nearestObj,
            proximityState: proxState,
            proximityColor: proxColor,
            riskScore,
            riskLevel,
            isCritical: isCrit,
            isCaution: isCaut,
            globalStateText: stateText,
            globalStateColor: stateColor,
            seatbeltStatus: 'FASTENED',
            activeAlerts,
            recentEvents: prev.safety.recentEvents,
          },
          history: updatedHistory,
          shiftDebrief: {
            ...prev.shiftDebrief,
            shiftDuration: `${baseShiftHours.toFixed(1)} HRS`,
            actualFuelRate: debriefFuelRate,
            fuelDeviation: debriefDeviation,
            idleFuel: accumulatedIdle,
            safetyAlertCount: alertCount,
          },
          tickCount: nextTick,
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        toggleDemoMode,
        setDemoMode,
        demoState,
        manualMachineY,
        setManualMachineY,
        moveMachineUp,
        moveMachineDown,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
