import type { Machine } from '../types';

// Phase 2/3: replace with GET /api/machines
export const mockMachines: Machine[] = [
  {
    id: 'EXC-1042',
    model: 'CAT 320',
    type: 'excavator',
    displayName: 'CAT 320 Excavator',
    status: 'operating',
    engineHours: 3821,
    ageYears: 4,
    siteId: 'SITE-ALPHA',
    currentTaskId: 'T-1042',
    currentZone: 'Zone A',
  },
  {
    id: 'WL-0953',
    model: 'CAT 950',
    type: 'wheel-loader',
    displayName: 'CAT 950 Wheel Loader',
    status: 'idle',
    engineHours: 2140,
    ageYears: 2,
    siteId: 'SITE-ALPHA',
    currentTaskId: 'T-1043',
    currentZone: 'Zone B',
  },
  {
    id: 'DZ-0611',
    model: 'CAT D6',
    type: 'dozer',
    displayName: 'CAT D6 Dozer',
    status: 'maintenance',
    engineHours: 5490,
    ageYears: 7,
    siteId: 'SITE-ALPHA',
    currentTaskId: null,
    currentZone: null,
  },
  {
    id: 'GR-1401',
    model: 'CAT 140',
    type: 'motor-grader',
    displayName: 'CAT 140 Motor Grader',
    status: 'operating',
    engineHours: 1870,
    ageYears: 3,
    siteId: 'SITE-ALPHA',
    currentTaskId: 'T-1045',
    currentZone: 'Zone D',
  },
  {
    id: 'AH-7451',
    model: 'CAT 745',
    type: 'articulated-hauler',
    displayName: 'CAT 745 Articulated Hauler',
    status: 'operating',
    engineHours: 3104,
    ageYears: 5,
    siteId: 'SITE-ALPHA',
    currentTaskId: 'T-1046',
    currentZone: 'Zone C',
  },
];

export const getCurrentMachine = (): Machine => mockMachines[0];

export const getMachineById = (id: string): Machine | undefined =>
  mockMachines.find((m) => m.id === id);
