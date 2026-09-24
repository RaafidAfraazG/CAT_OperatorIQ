import { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, User, Truck, Box, CheckCircle2, XCircle, AlertCircle, Brain, Activity
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import type { IncidentReport, IncidentType, IncidentSeverity, ProximityObject } from '../types';
import { api } from '../api/client';

// Simulated Proximity Sensor Output for Demo purposes
const simulatedProximity = [
  { label: 'Worker 1', type: 'worker', distanceM: 4.2, status: 'warning' },
  { label: 'Haul Truck', type: 'vehicle', distanceM: 8.7, status: 'safe' },
  { label: 'Excavation Edge', type: 'obstacle', distanceM: 12.4, status: 'safe' }
];

function ProximityIndicator({ obj }: { obj: any }) {
  const iconMap: Record<string, any> = {
    worker:   User,
    vehicle:  Truck,
    obstacle: Box,
  };
  const Icon = iconMap[obj.type] || Box;

  const colorMap: Record<string, string> = {
    safe:     'border-status-safe bg-status-safeD/10 text-status-safe',
    warning:  'border-status-warn bg-status-warnD/10 text-status-warn',
    critical: 'border-status-critical bg-status-criticalD/10 text-status-critical',
  };

  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${colorMap[obj.status]}`}>
      <Icon size={20} />
      <span className="text-xs font-semibold">{obj.label}</span>
      {obj.distanceM > 0 && (
        <span className="text-xs font-mono">{obj.distanceM} m</span>
      )}
      <StatusBadge status={obj.status === 'safe' ? 'safe' : obj.status === 'warning' ? 'warning' : 'critical'} dot={false}>
        {obj.status.toUpperCase()}
      </StatusBadge>
    </div>
  );
}

function ProximityMap({ machineId, risk }: { machineId: string, risk: any }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-surface-400" />
        <h2 className="text-sm font-semibold text-surface-100">Proximity Monitor (Simulated Sensor)</h2>
        {risk && (
          <StatusBadge status={risk.risk_level === 'High' ? 'critical' : risk.risk_level === 'Medium' ? 'warning' : 'safe'} className="ml-auto">
            AI Assessed: {risk.risk_level.toUpperCase()}
          </StatusBadge>
        )}
      </div>

      <div className="flex flex-col items-center mb-4">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute w-48 h-48 rounded-full border border-surface-700/40" />
          <div className="absolute w-32 h-32 rounded-full border border-surface-700/60" />
          <div className="absolute w-16 h-16 rounded-full border border-brand-500/40 bg-brand-500/5" />

          <div className="z-10 flex flex-col items-center gap-1">
            <Shield size={24} className="text-brand-400" />
            <span className="text-xs font-bold text-brand-400">MACHINE</span>
            <span className="text-xs text-surface-500 font-mono">{machineId || 'UNK'}</span>
          </div>

          <div className="absolute bottom-2 left-2 flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-full bg-status-warnD/20 border border-status-warn/50 flex items-center justify-center animate-pulse-slow">
              <User size={14} className="text-status-warn" />
            </div>
            <span className="text-xs font-mono text-status-warn">4.2m</span>
          </div>

          <div className="absolute top-2 right-2 flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-full bg-status-safeD/20 border border-status-safe/50 flex items-center justify-center">
              <Truck size={14} className="text-status-safe" />
            </div>
            <span className="text-xs font-mono text-status-safe">8.7m</span>
          </div>

          <div className="absolute bottom-2 right-2 flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-full bg-status-safeD/20 border border-status-safe/50 flex items-center justify-center">
              <Box size={14} className="text-status-safe" />
            </div>
            <span className="text-xs font-mono text-status-safe">12.4m</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {simulatedProximity.map((obj) => (
          <ProximityIndicator key={obj.label} obj={obj} />
        ))}
      </div>
    </Card>
  );
}

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function IncidentModal({ isOpen, onClose }: IncidentModalProps) {
  const [form, setForm] = useState<Partial<IncidentReport>>({
    type: 'near-miss',
    severity: 'medium',
    description: '',
    location: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      setForm({ type: 'near-miss', severity: 'medium', description: '', location: '' });
    }, 1800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Incident">
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 size={40} className="text-status-safe" />
          <p className="text-base font-semibold text-surface-100">Incident Reported</p>
          <p className="text-sm text-surface-400 text-center">
            Your incident has been logged and will be reviewed by the site supervisor.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1.5">
              Incident Type <span className="text-status-critical">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as IncidentType }))}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2
                         text-sm text-surface-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="near-miss">Near Miss</option>
              <option value="property-damage">Property Damage</option>
              <option value="personal-injury">Personal Injury</option>
              <option value="equipment-fault">Equipment Fault</option>
              <option value="environmental">Environmental</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1.5">
              Severity <span className="text-status-critical">*</span>
            </label>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as IncidentSeverity }))}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2
                         text-sm text-surface-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1.5">
              Location <span className="text-status-critical">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Zone A, near the north embankment"
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2
                         text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1.5">
              Description <span className="text-status-critical">*</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe what happened..."
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2
                         text-sm text-surface-100 placeholder:text-surface-500 resize-none focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-danger flex-1 justify-center">
              <AlertTriangle size={14} />
              Submit Incident
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function Safety() {
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [operator, setOperator] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        if (operators.length > 0) {
          const op = operators[0];
          setOperator(op);
          
          const riskData = await api.getSafetyRisk(op.operator_id);
          setRisk(riskData);
          
          const machinesData = await api.getMachines();
          if (machinesData.length > 0) setMachine(machinesData[0]);
        }

        const [eventsData, alertsData] = await Promise.all([
          api.getSafetyEvents(),
          api.getAlerts()
        ]);
        
        const mappedEvents = eventsData.map((e: any) => ({
          id: e.event_id,
          type: 'incident-reported',
          severity: e.severity.toLowerCase(),
          description: `${e.event_type} - Machine State: ${e.machine_state}`,
          time: new Date(e.timestamp).toLocaleString(),
          resolved: e.resolved
        }));
        
        setEvents(mappedEvents.slice(0, 10));
        setAlerts(alertsData.filter((a: any) => !a.resolved));
      } catch (err) {
        console.error("Failed to load safety data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const overallColor = risk?.risk_level === 'Low' ? 'text-status-safe'
    : risk?.risk_level === 'Medium' ? 'text-status-warn' : 'text-status-critical';
  const overallBg = risk?.risk_level === 'Low' ? 'bg-status-safeD/10 border-status-safeD/30'
    : risk?.risk_level === 'Medium' ? 'bg-status-warnD/10 border-status-warnD/30'
    : 'bg-status-criticalD/10 border-status-criticalD/30';

  const eventIconMap: Record<string, any> = {
    'proximity-warning': AlertTriangle,
    'seatbelt-check':    CheckCircle2,
    'system-init':       Shield,
    'speed-warning':     AlertCircle,
    'incident-reported': XCircle,
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">Safety Monitor</h1>
            <p className="text-sm text-surface-400 mt-1">
              Real-time proximity and safety status for {machine?.machine_id || 'Machine'}
            </p>
          </div>
          <button className="btn-danger" onClick={() => setIncidentModalOpen(true)}>
            <AlertTriangle size={16} />
            Report Incident
          </button>
        </div>

        {loading ? (
           <div className="text-surface-400 text-sm">Loading AI Safety Profile...</div>
        ) : (
          <div className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${overallBg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full shrink-0 ${
                risk?.risk_level === 'Low' ? 'bg-status-safe animate-pulse-slow' :
                risk?.risk_level === 'Medium' ? 'bg-status-warn animate-pulse-slow' :
                'bg-status-critical animate-pulse'
              }`} aria-hidden="true" />
              <div>
                <p className={`text-xl font-bold uppercase ${overallColor}`}>
                  {risk?.risk_level === 'Low' ? 'SAFE TO OPERATE' : risk?.risk_level === 'Medium' ? 'CAUTION ADVISED' : 'HIGH RISK'}
                </p>
                <p className="text-sm text-surface-400">
                  {risk?.risk_factors?.length > 0 ? `Risk factors: ${risk.risk_factors.join(', ')}` : 'All safety systems operating normally.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-surface-900/50 rounded-lg px-3 py-1.5 border border-surface-700/50">
              <Brain size={14} className="text-brand-400" />
              <span className="text-xs text-brand-400 font-mono font-bold">AI ASSESSED</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ProximityMap machineId={machine?.machine_id} risk={risk} />
          </div>
          
          <div className="space-y-3">
            <Card className="p-4 border-t-2 border-brand-500">
              <div className="flex items-center gap-2 mb-3">
                 <Brain size={16} className="text-brand-400" />
                 <p className="section-label">AI Safety Insights</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-surface-200">
                  {risk?.recommendation || 'No critical recommendations at this time.'}
                </p>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-surface-700">
                   <span className="text-surface-400">Calculated Safety Score</span>
                   <span className={`font-bold font-mono ${risk?.score >= 80 ? 'text-status-safe' : 'text-status-warn'}`}>
                     {Math.round(risk?.score || 100)} / 100
                   </span>
                </div>
              </div>
            </Card>

            {alerts.length > 0 ? (
              alerts.map((a: any) => (
                <Card key={a.alert_id} className="p-4 border-status-warn/30 bg-status-warnD/5 mb-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-status-warn mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-status-warn mb-1">{a.alert_type.toUpperCase()}</p>
                      <p className="text-xs text-surface-300 mb-2">{a.message}</p>
                      <p className="text-xs font-semibold text-surface-200 mb-1">Recommended action:</p>
                      <p className="text-xs text-surface-400">{a.recommended_action}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-4 border-status-safe/30 bg-status-safeD/5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-status-safe mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-status-safe mb-1">NO ACTIVE ALERTS</p>
                    <p className="text-xs text-surface-400">All systems operating normally.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-4">Recent Safety Events</h2>
          {loading ? (
             <div className="text-surface-400 text-sm">Loading events...</div>
          ) : (
            <div className="space-y-2">
              {events.map((evt) => {
                const Icon = eventIconMap[evt.type as keyof typeof eventIconMap] ?? AlertCircle;
                const iconColor =
                  evt.severity === 'high' || evt.severity === 'critical'
                    ? 'text-status-critical'
                    : evt.severity === 'medium'
                    ? 'text-status-warn'
                    : 'text-surface-400';

                return (
                  <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-750 transition-colors">
                    <Icon size={15} className={`mt-0.5 shrink-0 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-200">{evt.description}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{evt.time}</p>
                    </div>
                    <StatusBadge status={
                      evt.severity === 'critical' || evt.severity === 'high' ? 'critical' :
                      evt.severity === 'medium' ? 'warning' : 'neutral'
                    } dot={false}>
                      {evt.resolved ? 'Resolved' : evt.severity.charAt(0).toUpperCase() + evt.severity.slice(1)}
                    </StatusBadge>
                  </div>
                );
              })}
              {events.length === 0 && <p className="text-xs text-surface-500">No safety events found.</p>}
            </div>
          )}
        </Card>
      </div>

      <IncidentModal isOpen={incidentModalOpen} onClose={() => setIncidentModalOpen(false)} />
    </>
  );
}
