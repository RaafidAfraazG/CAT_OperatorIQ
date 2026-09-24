import type { Task } from '../types';

// Phase 2/3: replace with GET /api/tasks
export const mockTasks: Task[] = [
  {
    id: 'T-1042',
    title: 'Earth Excavation',
    machineId: 'EXC-1042',
    zone: 'Zone A',
    scheduledStart: '08:00',
    estimatedDurationMin: 138,
    status: 'in-progress',
    progressPercent: 72,
    elapsedMin: 102,
    predictedRemainingMin: 38,
    estimatedCompletion: '14:27',
    aiConfidence: 87,
    predictionFactors: [
      { label: 'Wet soil conditions', deltaMin: 8 },
      { label: 'Terrain slope', deltaMin: 4 },
      { label: 'Operator skill level', deltaMin: -3 },
    ],
  },
  {
    id: 'T-1043',
    title: 'Material Loading',
    machineId: 'WL-0953',
    zone: 'Zone B',
    scheduledStart: '11:00',
    estimatedDurationMin: 96,
    status: 'scheduled',
  },
  {
    id: 'T-1044',
    title: 'Trenching',
    machineId: 'EXC-1042',
    zone: 'Zone C',
    scheduledStart: '14:00',
    estimatedDurationMin: 120,
    status: 'scheduled',
  },
  {
    id: 'T-1045',
    title: 'Grading',
    machineId: 'GR-1401',
    zone: 'Zone D',
    scheduledStart: '16:30',
    estimatedDurationMin: 90,
    status: 'scheduled',
  },
  {
    id: 'T-1041',
    title: 'Site Preparation',
    machineId: 'DZ-0611',
    zone: 'Zone A',
    scheduledStart: '06:00',
    estimatedDurationMin: 110,
    actualDurationMin: 105,
    status: 'completed',
    progressPercent: 100,
  },
  {
    id: 'T-1046',
    title: 'Material Hauling',
    machineId: 'AH-7451',
    zone: 'Zone C',
    scheduledStart: '09:30',
    estimatedDurationMin: 180,
    status: 'in-progress',
    progressPercent: 45,
    elapsedMin: 82,
    predictedRemainingMin: 98,
  },
];

export const getCurrentTask = (): Task => mockTasks[0];

export const getTaskById = (id: string): Task | undefined =>
  mockTasks.find((t) => t.id === id);

export const getTasksByMachine = (machineId: string): Task[] =>
  mockTasks.filter((t) => t.machineId === machineId);
