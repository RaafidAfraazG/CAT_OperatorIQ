import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../common/Card';
import { safetySummary } from '../../data/mockSafety';

export default function SafetyStatusCard() {
  const navigate = useNavigate();

  const items = [
    { label: 'Seatbelt', value: safetySummary.seatbeltStatus, status: 'safe' as const },
    { label: 'Nearest Person', value: `${safetySummary.nearestPersonM} m`, status: 'safe' as const },
    { label: 'Nearest Obstacle', value: `${safetySummary.nearestObstacleM} m`, status: 'safe' as const },
    { label: 'Machine Movement', value: safetySummary.machineMovement, status: 'safe' as const },
  ];

  return (
    <Card className="p-5">
      <CardHeader
        title="Safety Monitor"
        icon={<Shield size={16} />}
        action={
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-safe animate-pulse-slow" aria-hidden="true" />
            <span className="text-xs text-status-safe font-medium">All systems normal</span>
          </span>
        }
      />

      {/* Safety items grid */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {items.map((item) => (
          <div key={item.label} className="bg-surface-750 rounded-lg px-3 py-2.5">
            <p className="text-xs text-surface-400 mb-1">{item.label}</p>
            <p className="text-sm font-semibold text-status-safe">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Last event */}
      <div className="mt-3 flex items-start gap-2 bg-status-warnD/10 border border-status-warnD/20
                      rounded-lg px-3 py-2.5">
        <AlertTriangle size={14} className="text-status-warn mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium text-surface-200">Last safety event</p>
          <p className="text-xs text-surface-400">
            {safetySummary.lastEvent.time} · {safetySummary.lastEvent.description}
          </p>
        </div>
      </div>

      {/* Action */}
      <button
        className="btn-secondary w-full mt-4 justify-center"
        onClick={() => navigate('/safety')}
        aria-label="View Safety Monitor page"
      >
        <Shield size={14} />
        View Safety
        <ChevronRight size={14} className="ml-auto" />
      </button>
    </Card>
  );
}
