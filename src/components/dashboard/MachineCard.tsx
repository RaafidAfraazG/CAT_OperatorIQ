import { MapPin, Clock, Gauge, Wrench } from 'lucide-react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';

interface MachineCardProps {
  machine: any;
}

export default function MachineCard({ machine }: MachineCardProps) {
  if (!machine) return null;
  
  // Estimate age from year_of_manufacture if available
  const age = machine.year_of_manufacture ? new Date().getFullYear() - machine.year_of_manufacture : 0;

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={14} className="text-brand-400" />
            <span className="section-label">Current Machine</span>
          </div>
          <h2 className="text-lg font-bold text-surface-50 capitalize">{machine.model || machine.machine_type}</h2>
          <p className="text-xs font-mono text-surface-400 mt-0.5">{machine.machine_id}</p>
        </div>
        <StatusBadge status="safe">Operating</StatusBadge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-750 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge size={12} className="text-surface-400" />
            <span className="text-xs text-surface-400">Engine Hours</span>
          </div>
          <p className="data-value text-sm font-semibold">
            {machine.total_engine_hours_at_start ? machine.total_engine_hours_at_start.toLocaleString() : '0'} h
          </p>
        </div>

        <div className="bg-surface-750 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="text-surface-400" />
            <span className="text-xs text-surface-400">Machine Age</span>
          </div>
          <p className="data-value text-sm font-semibold">
            {age} years
          </p>
        </div>
      </div>
    </Card>
  );
}
