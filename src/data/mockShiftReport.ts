import type { ShiftSummary } from '../types';

// Phase 2/3: replace with GET /api/shift-report?operatorId=OP-1007&date=today
export const mockShiftSummary: ShiftSummary = {
  date: '2026-09-23',
  operatorId: 'OP-1007',
  machineId: 'EXC-1042',
  tasksCompleted: 4,
  tasksTotal: 4,
  productivityPct: 92,
  productivityDelta: 6,
  fuelEfficiencyDelta: 8,
  idleRatioPct: 14,
  seatbeltCompliancePct: 98,
  safetyIncidents: 0,
  predictionAccuracyPct: 91,
  recommendation:
    'Your task efficiency improved compared with the previous shift. Continue monitoring idle time during waiting periods — reducing idle from 14% to below 10% could save approximately 4.2 L of fuel per shift.',
  taskSummaries: [
    { taskId: 'T-1041', title: 'Site Preparation', estimatedMin: 110, actualMin: 105, fuelL: 22.4 },
    { taskId: 'T-1042', title: 'Earth Excavation', estimatedMin: 138, actualMin: 148, fuelL: 38.6 },
    { taskId: 'T-1043', title: 'Material Loading', estimatedMin: 96, actualMin: 91, fuelL: 18.2 },
    { taskId: 'T-1044', title: 'Trenching', estimatedMin: 120, actualMin: 116, fuelL: 28.9 },
  ],
  hourlyFuel: [
    { hour: '07:00', liters: 8.2 },
    { hour: '08:00', liters: 14.6 },
    { hour: '09:00', liters: 16.1 },
    { hour: '10:00', liters: 17.4 },
    { hour: '11:00', liters: 15.8 },
    { hour: '12:00', liters: 9.4 },
    { hour: '13:00', liters: 14.2 },
    { hour: '14:00', liters: 16.9 },
    { hour: '15:00', liters: 15.3 },
    { hour: '16:00', liters: 12.7 },
  ],
};
