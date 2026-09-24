// ============================================================
// OperatorIQ – Domain Types
// All interfaces are designed for future API compatibility.
// Phase 2/3: replace mock data imports with API service calls.
// ============================================================

// ─── Machine ────────────────────────────────────────────────

export type MachineStatus = 'operating' | 'idle' | 'maintenance' | 'offline';
export type MachineType =
  | 'excavator'
  | 'wheel-loader'
  | 'dozer'
  | 'motor-grader'
  | 'articulated-hauler'
  | 'other';

export interface Machine {
  id: string;           // e.g. "EXC-1042"
  model: string;        // e.g. "CAT 320"
  type: MachineType;
  displayName: string;  // e.g. "CAT 320 Excavator"
  status: MachineStatus;
  engineHours: number;
  ageYears: number;
  siteId: string;
  currentTaskId: string | null;
  currentZone: string | null;
}

// ─── Operator ────────────────────────────────────────────────

export type SkillLevel = 'trainee' | 'intermediate' | 'experienced' | 'expert';

export interface Operator {
  id: string;           // e.g. "OP-1007"
  name: string;
  avatarInitials: string;
  skillLevel: SkillLevel;
  experienceYears: number;
  currentMachineId: string | null;
  isOnline: boolean;
}

// ─── Task ────────────────────────────────────────────────────

export type TaskStatus = 'scheduled' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';

export interface Task {
  id: string;           // e.g. "T-1042"
  title: string;
  machineId: string;
  zone: string;
  scheduledStart: string;     // ISO time string HH:MM
  estimatedDurationMin: number;
  actualDurationMin?: number;
  status: TaskStatus;
  progressPercent?: number;
  elapsedMin?: number;
  predictedRemainingMin?: number;
  estimatedCompletion?: string;
  aiConfidence?: number;
  predictionFactors?: PredictionFactor[];
}

export interface PredictionFactor {
  label: string;
  deltaMin: number;    // positive = adds time, negative = saves time
}

// ─── Telemetry ────────────────────────────────────────────────

export interface TelemetryPoint {
  timestamp: string;   // ISO or HH:MM label
  engineRpm: number;
  engineLoadPct: number;
  hydraulicPressureBar: number;
  coolantTempC: number;
  fuelLevelPct: number;
  fuelConsumptionLph: number;
  speedKmh: number;
}

export interface MachineTelemetry {
  machineId: string;
  current: TelemetryPoint;
  history: TelemetryPoint[];  // ordered oldest → newest
  operatingState: string;     // e.g. "DIGGING", "TRAVELLING", "IDLE"
  healthStatus: 'normal' | 'caution' | 'critical';
}

// ─── Safety ────────────────────────────────────────────────

export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';
export type SafetyEventType =
  | 'proximity-warning'
  | 'seatbelt-check'
  | 'system-init'
  | 'speed-warning'
  | 'incident-reported';

export interface SafetyEvent {
  id: string;
  type: SafetyEventType;
  time: string;           // HH:MM AM/PM
  description: string;
  severity: SafetySeverity;
  resolved: boolean;
}

export interface ProximityObject {
  label: string;
  type: 'operator' | 'worker' | 'vehicle' | 'obstacle';
  distanceM: number;
  status: 'safe' | 'warning' | 'critical';
  angleDeg?: number;     // for visual placement (0 = top, 90 = right, etc.)
}

export interface SafetyStatus {
  machineId: string;
  overallStatus: 'safe' | 'warning' | 'critical';
  seatbeltSecured: boolean;
  speedKmh: number;
  machineState: string;   // e.g. "REVERSING", "STATIONARY", "DIGGING"
  proximityObjects: ProximityObject[];
  recentEvents: SafetyEvent[];
}

// ─── Incident Report ────────────────────────────────────────

export type IncidentType =
  | 'near-miss'
  | 'property-damage'
  | 'personal-injury'
  | 'equipment-fault'
  | 'environmental'
  | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentReport {
  id?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  timestamp?: string;
  operatorId?: string;
  machineId?: string;
}

// ─── AI Insights ────────────────────────────────────────────

export type InsightCategory = 'safety' | 'productivity' | 'fuel' | 'behavior';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  summary: string;
  detail: string;
  metrics?: InsightMetric[];
  recommendation: string;
  timestamp: string;
}

export interface InsightMetric {
  label: string;
  value: string;
  subLabel?: string;
}

// ─── Training ────────────────────────────────────────────────

export type TrainingDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TrainingCategory = 'safety' | 'efficiency' | 'fuel' | 'operation' | 'compliance';
export type TrainingStatus = 'not-started' | 'in-progress' | 'completed';

export interface TrainingModule {
  id: string;
  title: string;
  category: TrainingCategory;
  durationMin: number;
  difficulty: TrainingDifficulty;
  description: string;
  recommendationReason?: string;
  isRecommended: boolean;
  status: TrainingStatus;
  progressPct?: number;
  thumbnailIcon?: string;
}

// ─── Shift Report ────────────────────────────────────────────

export interface ShiftTaskSummary {
  taskId: string;
  title: string;
  estimatedMin: number;
  actualMin: number;
  fuelL: number;
}

export interface ShiftSummary {
  date: string;
  operatorId: string;
  machineId: string;
  tasksCompleted: number;
  tasksTotal: number;
  productivityPct: number;
  productivityDelta: number;  // vs previous shift
  fuelEfficiencyDelta: number;
  idleRatioPct: number;
  seatbeltCompliancePct: number;
  safetyIncidents: number;
  predictionAccuracyPct: number;
  recommendation: string;
  taskSummaries: ShiftTaskSummary[];
  hourlyFuel: { hour: string; liters: number }[];
}

// ─── Site ───────────────────────────────────────────────────

export interface Site {
  id: string;
  name: string;
  description: string;
  location: string;
  activeMachineIds: string[];
}
