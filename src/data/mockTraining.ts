import type { TrainingModule } from '../types';

// Phase 2/3: replace with GET /api/training
export const mockTrainingModules: TrainingModule[] = [
  {
    id: 'TRN-001',
    title: 'Efficient Idle Management',
    category: 'efficiency',
    durationMin: 4,
    difficulty: 'intermediate',
    description:
      'Learn practical techniques to minimize idle time during excavation operations. Covers engine shutdown protocols, smart waiting strategies, and fuel savings calculations.',
    recommendationReason: 'Recommended based on recent high idle behavior detected in your shifts.',
    isRecommended: true,
    status: 'not-started',
  },
  {
    id: 'TRN-002',
    title: 'Safe Reversing Practices',
    category: 'safety',
    durationMin: 6,
    difficulty: 'beginner',
    description:
      'Covers safe reversing procedures for heavy equipment including spotters, camera systems, and proximity sensor interpretation. Includes common blind-spot awareness training.',
    recommendationReason: 'Recommended due to recent proximity warnings during reversing operations.',
    isRecommended: true,
    status: 'not-started',
  },
  {
    id: 'TRN-003',
    title: 'Proximity Awareness',
    category: 'safety',
    durationMin: 5,
    difficulty: 'beginner',
    description:
      'Understand how to read and respond to proximity warning systems. Covers distance thresholds, alert categories, and appropriate machine response procedures.',
    recommendationReason: 'Flagged due to 5 proximity warning events in recent shifts.',
    isRecommended: true,
    status: 'in-progress',
    progressPct: 40,
  },
  {
    id: 'TRN-004',
    title: 'Fuel-Efficient Machine Operation',
    category: 'fuel',
    durationMin: 7,
    difficulty: 'intermediate',
    description:
      'Advanced techniques for reducing fuel consumption on heavy equipment. Covers throttle management, hydraulic optimization, and load sensing systems.',
    recommendationReason: 'Recommended due to fuel consumption 21% above baseline.',
    isRecommended: true,
    status: 'not-started',
  },
  {
    id: 'TRN-005',
    title: 'Excavator Hydraulics Fundamentals',
    category: 'operation',
    durationMin: 12,
    difficulty: 'advanced',
    description:
      'Deep dive into hydraulic system principles for excavators. Covers pressure management, flow control, and troubleshooting hydraulic issues.',
    isRecommended: false,
    status: 'completed',
    progressPct: 100,
  },
  {
    id: 'TRN-006',
    title: 'Pre-Shift Inspection Checklist',
    category: 'compliance',
    durationMin: 3,
    difficulty: 'beginner',
    description:
      'Step-by-step walkthrough of the required pre-shift safety and mechanical inspection for heavy equipment operators.',
    isRecommended: false,
    status: 'completed',
    progressPct: 100,
  },
  {
    id: 'TRN-007',
    title: 'Terrain Reading & Soil Conditions',
    category: 'operation',
    durationMin: 8,
    difficulty: 'intermediate',
    description:
      'Understanding how soil type, moisture content, and terrain slope affect excavation efficiency and machine performance. Includes adaptive technique adjustments.',
    isRecommended: false,
    status: 'not-started',
  },
];

export const getRecommendedModules = (): TrainingModule[] =>
  mockTrainingModules.filter((m) => m.isRecommended);

export const getModuleById = (id: string): TrainingModule | undefined =>
  mockTrainingModules.find((m) => m.id === id);

export const trainingProgress = 68; // Overall training completion %
