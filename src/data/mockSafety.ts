import type { SafetyStatus } from '../types';

// Phase 2/3: replace with GET /api/safety?machineId=EXC-1042
export const mockSafetyStatus: SafetyStatus = {
  machineId: 'EXC-1042',
  overallStatus: 'warning',
  seatbeltSecured: true,
  speedKmh: 3.8,
  machineState: 'REVERSING',
  proximityObjects: [
    {
      label: 'Worker',
      type: 'worker',
      distanceM: 4.2,
      status: 'warning',
      angleDeg: 225,
    },
    {
      label: 'Vehicle',
      type: 'vehicle',
      distanceM: 8.7,
      status: 'safe',
      angleDeg: 45,
    },
    {
      label: 'Obstacle',
      type: 'obstacle',
      distanceM: 12.4,
      status: 'safe',
      angleDeg: 135,
    },
    {
      label: 'Operator Zone',
      type: 'operator',
      distanceM: 0,
      status: 'safe',
      angleDeg: 0,
    },
  ],
  recentEvents: [
    {
      id: 'EVT-001',
      type: 'proximity-warning',
      time: '10:42 AM',
      description: 'Worker detected within operating zone (4.2 m)',
      severity: 'medium',
      resolved: false,
    },
    {
      id: 'EVT-002',
      type: 'seatbelt-check',
      time: '09:18 AM',
      description: 'Seatbelt compliance check completed',
      severity: 'low',
      resolved: true,
    },
    {
      id: 'EVT-003',
      type: 'system-init',
      time: '08:31 AM',
      description: 'Safety monitoring system initialized',
      severity: 'low',
      resolved: true,
    },
  ],
};

// Summary numbers for the Command Center
export const safetySummary = {
  status: 'Normal' as const,
  eventsToday: 1,
  seatbeltStatus: 'SECURED' as const,
  nearestPersonM: 7.4,
  nearestObstacleM: 12.2,
  machineMovement: 'ACTIVE' as const,
  lastEvent: { time: '10:42 AM', description: 'Proximity warning' },
};
