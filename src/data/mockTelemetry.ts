import type { MachineTelemetry, TelemetryPoint } from '../types';

// Helper to generate a realistic time-series for charts
const generateRpmHistory = (): TelemetryPoint[] => {
  const base = [
    { rpm: 1200, load: 30, pressure: 180, coolant: 82, fuel: 70, consumption: 12.1, speed: 0 },
    { rpm: 1650, load: 52, pressure: 220, coolant: 84, fuel: 69, consumption: 14.8, speed: 2.1 },
    { rpm: 1820, load: 65, pressure: 265, coolant: 86, fuel: 68, consumption: 16.1, speed: 3.6 },
    { rpm: 1900, load: 72, pressure: 280, coolant: 87, fuel: 67, consumption: 17.0, speed: 4.0 },
    { rpm: 1840, load: 68, pressure: 275, coolant: 88, fuel: 66, consumption: 16.4, speed: 3.8 },
    { rpm: 1760, load: 61, pressure: 258, coolant: 87, fuel: 65, consumption: 15.7, speed: 3.4 },
    { rpm: 1920, load: 75, pressure: 291, coolant: 89, fuel: 64, consumption: 17.5, speed: 4.2 },
    { rpm: 1850, load: 70, pressure: 283, coolant: 88, fuel: 63, consumption: 16.8, speed: 4.1 },
    { rpm: 1780, load: 63, pressure: 270, coolant: 88, fuel: 63, consumption: 16.2, speed: 3.9 },
    { rpm: 1840, load: 68, pressure: 281, coolant: 88, fuel: 63, consumption: 16.4, speed: 4.2 },
  ];

  const hours = ['07:45', '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00'];

  return base.map((b, i) => ({
    timestamp: hours[i],
    engineRpm: b.rpm,
    engineLoadPct: b.load,
    hydraulicPressureBar: b.pressure,
    coolantTempC: b.coolant,
    fuelLevelPct: b.fuel,
    fuelConsumptionLph: b.consumption,
    speedKmh: b.speed,
  }));
};

export const mockTelemetry: MachineTelemetry = {
  machineId: 'EXC-1042',
  current: {
    timestamp: '10:00',
    engineRpm: 1840,
    engineLoadPct: 68,
    hydraulicPressureBar: 281,
    coolantTempC: 88,
    fuelLevelPct: 63,
    fuelConsumptionLph: 16.4,
    speedKmh: 4.2,
  },
  history: generateRpmHistory(),
  operatingState: 'DIGGING',
  healthStatus: 'normal',
};

// Phase 2/3: replace with GET /api/telemetry?machineId=EXC-1042
export const getTelemetryForMachine = (machineId: string): MachineTelemetry => {
  // In Phase 2, this returns real API data
  return { ...mockTelemetry, machineId };
};
