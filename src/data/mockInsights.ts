import type { Insight } from '../types';

// Phase 2/3: replace with GET /api/insights
export const mockInsights: Insight[] = [
  {
    id: 'INS-001',
    category: 'fuel',
    severity: 'warning',
    title: 'High Idle Detected',
    summary: 'Your idle ratio (28%) significantly exceeds your baseline (12%).',
    detail:
      'Elevated idle time has been detected across the past 3 shifts. This is contributing to above-average fuel consumption and increased engine wear.',
    metrics: [
      { label: 'Idle Ratio', value: '28%', subLabel: 'Current shift' },
      { label: 'Operator Baseline', value: '12%', subLabel: 'Historical avg.' },
      { label: 'Estimated Extra Fuel', value: '6.8 L', subLabel: 'vs. baseline' },
    ],
    recommendation:
      'Review extended waiting periods and shut down engine during prolonged inactivity where operationally appropriate.',
    timestamp: '10:15 AM',
  },
  {
    id: 'INS-002',
    category: 'productivity',
    severity: 'warning',
    title: 'Task Delay Risk',
    summary: 'Current task (Earth Excavation) is predicted to run 13 minutes over schedule.',
    detail:
      'Wet soil conditions detected from recent rainfall are increasing cycle times. Terrain slope in the current dig area is also a contributing factor.',
    metrics: [
      { label: 'Current Prediction', value: '2h 18m', subLabel: 'Estimated total' },
      { label: 'Original Estimate', value: '2h 05m', subLabel: 'Scheduled' },
      { label: 'Delay Risk', value: '+13 min', subLabel: 'Primary: wet soil' },
    ],
    recommendation:
      'Adjust dig angle to reduce soil adhesion. Consider requesting additional material support to maintain productivity.',
    timestamp: '09:50 AM',
  },
  {
    id: 'INS-003',
    category: 'fuel',
    severity: 'warning',
    title: 'Fuel Consumption Anomaly',
    summary: 'Fuel consumption is 21% above the expected rate for this task type.',
    detail:
      'Current consumption of 18.4 L/h exceeds the baseline expectation of 15.2 L/h for earth excavation operations. High idle periods and elevated engine load are primary contributors.',
    metrics: [
      { label: 'Current Rate', value: '18.4 L/h', subLabel: 'Live reading' },
      { label: 'Expected Rate', value: '15.2 L/h', subLabel: 'Task baseline' },
      { label: 'Contributing Factors', value: 'High idle, Load', subLabel: '' },
    ],
    recommendation:
      'Review hydraulic throttle settings and reduce unnecessary bucket movements between cycles.',
    timestamp: '09:30 AM',
  },
  {
    id: 'INS-004',
    category: 'safety',
    severity: 'warning',
    title: 'Safety Pattern Detected',
    summary: 'Repeated proximity warnings detected over recent shifts.',
    detail:
      '5 proximity warning events have been logged across your last 3 shifts, concentrated in reversing maneuvers near Zone A. This pattern suggests a potential blind-spot awareness gap.',
    metrics: [
      { label: 'Warning Events', value: '5', subLabel: 'Last 3 shifts' },
      { label: 'Primary Zone', value: 'Zone A', subLabel: 'Reversing ops' },
      { label: 'Severity', value: 'Medium', subLabel: 'Trending up' },
    ],
    recommendation:
      'Complete the recommended Proximity Awareness training module (5 min) before your next shift.',
    timestamp: '08:00 AM',
  },
  {
    id: 'INS-005',
    category: 'behavior',
    severity: 'info',
    title: 'Operator Performance Trending Upward',
    summary: 'Task efficiency improved by 6% compared to your previous shift.',
    detail:
      'Reduced swing times and more precise bucket placement have contributed to improved cycle efficiency. Your completion accuracy of 91% is above site average.',
    metrics: [
      { label: 'Productivity', value: '92%', subLabel: 'Current shift' },
      { label: 'Previous Shift', value: '86%', subLabel: 'Comparison' },
      { label: 'Prediction Accuracy', value: '91%', subLabel: 'AI confidence' },
    ],
    recommendation:
      'Maintain current operating pattern. Focus on reducing idle time to further improve efficiency score.',
    timestamp: '07:55 AM',
  },
];

export const getInsightsByCategory = (category: string): Insight[] => {
  if (category === 'all') return mockInsights;
  return mockInsights.filter((i) => i.category === category);
};
