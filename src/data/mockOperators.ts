import type { Operator } from '../types';

// Phase 2/3: replace with GET /api/operators
export const mockOperators: Operator[] = [
  {
    id: 'OP-1007',
    name: 'Alex Morgan',
    avatarInitials: 'AM',
    skillLevel: 'expert',
    experienceYears: 8,
    currentMachineId: 'EXC-1042',
    isOnline: true,
  },
  {
    id: 'OP-1024',
    name: 'Sam Rivera',
    avatarInitials: 'SR',
    skillLevel: 'experienced',
    experienceYears: 5,
    currentMachineId: 'WL-0953',
    isOnline: true,
  },
  {
    id: 'OP-1031',
    name: 'Jordan Lee',
    avatarInitials: 'JL',
    skillLevel: 'intermediate',
    experienceYears: 3,
    currentMachineId: 'GR-1401',
    isOnline: true,
  },
];

export const getCurrentOperator = (): Operator => mockOperators[0];
