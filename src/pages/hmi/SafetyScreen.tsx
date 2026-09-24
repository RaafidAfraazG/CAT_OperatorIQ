import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Truck, Box, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import Modal from '../../components/common/Modal';

// Simulated Proximity Sensor Output for Demo purposes
const simulatedProximity = [
  { label: 'WORKER', type: 'worker', distanceM: 4.2, status: 'warning', angle: 220 },
  { label: 'HAUL TRUCK', type: 'vehicle', distanceM: 8.7, status: 'safe', angle: 45 },
  { label: 'EDGE', type: 'obstacle', distanceM: 12.4, status: 'safe', angle: 135 }
];

const ExcavatorSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left Track */}
    <rect x="22" y="30" width="14" height="110" rx="4" fill="#141819" stroke="#5E676C" strokeWidth="1" />
    <path d="M26 30 L26 140 M32 30 L32 140" stroke="#080A0B" strokeWidth="1" strokeDasharray="4 4" />
    
    {/* Right Track */}
    <rect x="64" y="30" width="14" height="110" rx="4" fill="#141819" stroke="#5E676C" strokeWidth="1" />
    <path d="M68 30 L68 140 M74 30 L74 140" stroke="#080A0B" strokeWidth="1" strokeDasharray="4 4" />
    
    {/* Upper Structure / Body */}
    <rect x="30" y="45" width="40" height="65" rx="4" fill="#F1F3F4" stroke="#929A9E" strokeWidth="1" />
    
    {/* Rear Counterweight */}
    <rect x="30" y="90" width="40" height="20" rx="6" fill="#929A9E" />
    <text x="50" y="104" fill="#141819" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CAT</text>
    
    {/* Cab */}
    <rect x="32" y="48" width="16" height="22" rx="2" fill="#080A0B" stroke="#5E676C" strokeWidth="1" />
    <rect x="34" y="50" width="12" height="18" rx="1" fill="#141819" />
    
    {/* Boom */}
    <path d="M60 50 L60 10" stroke="#F1F3F4" strokeWidth="6" strokeLinecap="round" />
    <path d="M60 10 L60 5" stroke="#929A9E" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function IncidentModal({ isOpen, onClose }: IncidentModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    incident_type: 'near-miss',
    severity: 'medium',
    location_zone: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location_zone.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.reportIncident({
        incident_type: form.incident_type,
        severity: form.severity,
        location_zone: form.location_zone.trim(),
        description: form.description.trim() || undefined,
      });
      setIncidentId(result.incident_id || null);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIncidentId(null);
        setForm({ incident_type: 'near-miss', severity: 'medium', location_zone: '', description: '' });
        onClose();
      }, 2500);
    } catch (err) {
      setError('Failed to submit incident. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="REPORT INCIDENT">
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-6 bg-[#080A0B]">
          <CheckCircle2 size={48} className="text-[#42C76A]" />
          <p className="text-lg font-bold font-mono tracking-widest text-[#F1F3F4] uppercase">INCIDENT REPORTED</p>
          {incidentId && (
            <p className="text-xs font-mono tracking-widest text-[#FFCC00] uppercase">REF: {incidentId}</p>
          )}
          <p className="text-sm font-mono tracking-widest text-[#929A9E] text-center uppercase">
            LOGGED FOR SUPERVISOR REVIEW.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#080A0B] font-mono tracking-widest uppercase">
          {error && (
            <p className="text-xs text-[#E5484D] font-bold tracking-widest">{error}</p>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#5E676C]">
              INCIDENT TYPE <span className="text-[#E5484D]">*</span>
            </label>
            <select
              name="incident_type"
              value={form.incident_type}
              onChange={handleChange}
              className="w-full bg-[#0D1011] border border-[#141819] rounded-none px-4 py-3
                         text-sm text-[#F1F3F4] focus:border-[#FFCC00] focus:outline-none appearance-none"
              required
            >
              <option value="near-miss">NEAR MISS</option>
              <option value="property-damage">PROPERTY DAMAGE</option>
              <option value="personal-injury">PERSONAL INJURY</option>
              <option value="equipment-fault">EQUIPMENT FAULT</option>
              <option value="other">OTHER</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#5E676C]">
              SEVERITY <span className="text-[#E5484D]">*</span>
            </label>
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className="w-full bg-[#0D1011] border border-[#141819] rounded-none px-4 py-3
                         text-sm text-[#F1F3F4] focus:border-[#FFCC00] focus:outline-none appearance-none"
              required
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#5E676C]">
              LOCATION <span className="text-[#E5484D]">*</span>
            </label>
            <input
              type="text"
              name="location_zone"
              value={form.location_zone}
              onChange={handleChange}
              placeholder="E.G. ZONE A"
              className="w-full bg-[#0D1011] border border-[#141819] rounded-none px-4 py-3
                         text-sm text-[#F1F3F4] placeholder:text-[#5E676C] focus:outline-none focus:border-[#FFCC00]"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#5E676C]">DESCRIPTION</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="BRIEF DESCRIPTION OF WHAT HAPPENED..."
              rows={3}
              className="w-full bg-[#0D1011] border border-[#141819] rounded-none px-4 py-3
                         text-sm text-[#F1F3F4] placeholder:text-[#5E676C] focus:outline-none focus:border-[#FFCC00] resize-none"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" className="flex-1 py-4 border border-[#141819] text-[#929A9E] font-bold text-sm hover:text-[#F1F3F4] transition-colors" onClick={onClose}>
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#E5484D] text-[#080A0B] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#E5484D]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <AlertTriangle size={16} />
              {submitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function SafetyScreen() {
  const navigate = useNavigate();

  const [operator, setOperator] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        if (operators.length > 0) {
          const op = operators[0];
          setOperator(op);
          const riskData = await api.getSafetyRisk(op.operator_id).catch(() => null);
          setRisk(riskData);
        }

        const [eventsData, alertsData, machinesData] = await Promise.all([
          api.getSafetyEvents().catch(() => []),
          api.getAlerts().catch(() => []),
          api.getMachines().catch(() => [])
        ]);

        setEvents(eventsData);
        setAlerts(alertsData.filter((a: any) => a.resolved === 'false' || a.resolved === false));

        // Load latest telemetry for real seatbelt/proximity values
        if (machinesData.length > 0) {
          const machineId = machinesData[0].machine_id;
          const telData = await api.getTelemetry(machineId, 1).catch(() => []);
          if (telData && telData.length > 0) setTelemetry(telData[0]);
        }
      } catch (err) {
        console.error('Failed to load SAFETY data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full min-h-0 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none overflow-hidden">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4] animate-pulse">CONNECTING SAFETY SYSTEMS</p>
      </div>
    );
  }

  // Derive global state from real data
  // Hierarchy: CRITICAL > WARNING/CAUTION > SAFE
  const hasCriticalAlert = alerts.some(a => a.severity.toLowerCase() === 'critical');
  const hasWarningAlert = alerts.some(a => a.severity.toLowerCase() === 'warning' || a.severity.toLowerCase() === 'high');

  // Real proximity from telemetry (ML risk_level uses lowercase: low/moderate/high/critical)
  const nearestPersonM = telemetry?.nearest_person_distance_m ?? null;
  const nearestVehicleM = telemetry?.nearest_vehicle_distance_m ?? null;
  const nearestObstacleM = telemetry?.nearest_obstacle_distance_m ?? null;
  const seatbeltStatus = telemetry?.seatbelt_status ?? 'FASTENED';
  const PROXIMITY_DANGER_M = 3.0;
  const PROXIMITY_WARN_M = 8.0;
  const telDistances = [nearestPersonM, nearestVehicleM, nearestObstacleM].filter((d): d is number => d !== null);
  const minDistance = telDistances.length > 0 ? Math.min(...telDistances) : null;
  const hasCriticalProximity = minDistance !== null && minDistance < PROXIMITY_DANGER_M;
  const hasWarningProximity = minDistance !== null && minDistance < PROXIMITY_WARN_M;

  // ML risk_level is lowercase: 'low', 'moderate', 'high', 'critical'
  const isCritical = hasCriticalAlert || hasCriticalProximity || risk?.risk_level === 'critical' || risk?.risk_level === 'High';
  const isCaution = !isCritical && (hasWarningAlert || hasWarningProximity || risk?.risk_level === 'moderate' || risk?.risk_level === 'high' || risk?.risk_level === 'Medium');
  
  const globalStateText = isCritical ? 'CRITICAL HAZARD' : isCaution ? 'CAUTION' : 'SAFE TO OPERATE';
  const globalStateColor = isCritical ? 'text-[#E5484D]' : isCaution ? 'text-[#F2B84B]' : 'text-[#42C76A]';
  const riskScore = risk?.risk_score ?? 15;

  // Build real proximity objects from telemetry for radar display
  const realProximity = [
    ...(nearestPersonM !== null ? [{ label: 'WORKER', type: 'worker', distanceM: nearestPersonM, status: nearestPersonM < PROXIMITY_DANGER_M ? 'critical' : nearestPersonM < PROXIMITY_WARN_M ? 'warning' : 'safe', angle: 220 }] : []),
    ...(nearestVehicleM !== null ? [{ label: 'VEHICLE', type: 'vehicle', distanceM: nearestVehicleM, status: nearestVehicleM < PROXIMITY_DANGER_M ? 'critical' : nearestVehicleM < PROXIMITY_WARN_M ? 'warning' : 'safe', angle: 45 }] : []),
    ...(nearestObstacleM !== null ? [{ label: 'OBSTACLE', type: 'obstacle', distanceM: nearestObstacleM, status: nearestObstacleM < PROXIMITY_DANGER_M ? 'critical' : nearestObstacleM < PROXIMITY_WARN_M ? 'warning' : 'safe', angle: 135 }] : []),
  ];
  // Fallback to simulated if no telemetry loaded yet
  const proximityData = realProximity.length > 0 ? realProximity : simulatedProximity;

  // Find nearest hazard
  const sortedProximity = [...proximityData].sort((a, b) => a.distanceM - b.distanceM);
  const nearest = sortedProximity[0];

  const getZoneColor = (hazard: any) => hazard ? (hazard.status === 'critical' ? 'border-[#E5484D] bg-[#E5484D]/10' : 'border-[#F2B84B] bg-[#F2B84B]/10') : 'border-transparent bg-transparent';
  const frontHazard = proximityData.find((p: any) => (p.angle >= 315 || p.angle <= 45) && p.status !== 'safe');
  const rightHazard = proximityData.find((p: any) => (p.angle > 45 && p.angle < 135) && p.status !== 'safe');
  const rearHazard = proximityData.find((p: any) => (p.angle >= 135 && p.angle <= 225) && p.status !== 'safe');
  const leftHazard = proximityData.find((p: any) => (p.angle > 225 && p.angle < 315) && p.status !== 'safe');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none px-4 py-2 lg:py-4 lg:px-12 overflow-hidden">
      <IncidentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      
      <div className="max-w-[1600px] mx-auto w-full flex gap-4 lg:gap-8 h-full min-h-0">
        
        {/* LEFT COLUMN: STATE & STATUS */}
        <div className="w-1/4 flex flex-col h-full justify-between pb-4 shrink-0">
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
                SYSTEM STATE
              </span>
              <div className="flex items-center gap-4 mt-2">
                <div className={`w-4 h-4 rounded-full ${isCritical ? 'bg-[#E5484D] animate-pulse' : isCaution ? 'bg-[#F2B84B]' : 'bg-[#42C76A]'}`} />
                <span className={`font-mono text-3xl lg:text-4xl font-extrabold tracking-tight uppercase ${globalStateColor}`}>
                  {globalStateText}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-4">
              <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
                SAFETY RISK
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`font-mono text-5xl font-extrabold tracking-tighter ${isCritical ? 'text-[#E5484D]' : isCaution ? 'text-[#F2B84B]' : 'text-[#F1F3F4]'}`}>
                  {riskScore}
                </span>
                <span className="font-mono text-xl text-[#5E676C]">/ 100</span>
              </div>
            </div>

            <div className="w-full h-px bg-[#141819] my-4" />

            <div className="flex flex-col gap-6 font-mono text-sm tracking-widest uppercase font-bold">
              <div className="flex justify-between items-center">
                <span className="text-[#5E676C]">SEATBELT</span>
                <div className="flex items-center gap-2">
                  <span className={seatbeltStatus === 'UNFASTENED' ? 'text-[#E5484D]' : 'text-[#42C76A]'}>●</span>
                  <span className={seatbeltStatus === 'UNFASTENED' ? 'text-[#E5484D]' : 'text-[#F1F3F4]'}>{seatbeltStatus}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5E676C]">NEAREST OBJECT</span>
                <div className="flex items-center gap-2">
                  <span className={minDistance !== null && minDistance < PROXIMITY_WARN_M ? 'text-[#F2B84B]' : 'text-[#42C76A]'}>●</span>
                  <span className="text-[#F1F3F4]">{minDistance !== null ? `${minDistance.toFixed(1)}m` : 'CLEAR'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5E676C]">RADAR</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#42C76A]">●</span>
                  <span className="text-[#F1F3F4]">{telemetry ? 'ONLINE' : 'STANDBY'}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setModalOpen(true)}
            className="w-full py-5 border border-[#141819] flex items-center justify-center gap-3 font-mono text-sm font-bold tracking-widest text-[#929A9E] hover:text-[#F1F3F4] hover:border-[#5E676C] transition-colors uppercase mt-auto"
          >
            <AlertTriangle size={16} />
            REPORT INCIDENT →
          </button>
        </div>

        {/* CENTER COLUMN: MACHINE PROXIMITY */}
        <div className="flex-1 flex flex-col items-center justify-between relative py-2 lg:py-6 px-4 min-w-0">
          <div className="text-center font-mono text-xs text-[#5E676C] font-bold tracking-widest mb-4">FRONT<br/>↑</div>
          
          <div className="w-full max-w-[400px] aspect-[4/5] relative flex items-center justify-center">
            
            {/* Machine Silhouette */}
            <div className="absolute w-[80px] h-[120px] flex items-center justify-center z-10 pointer-events-none">
              <ExcavatorSVG className="w-full h-full" />
            </div>

            {/* Subtle Sensor Zones */}
            <div className="absolute inset-x-8 inset-y-16 border border-[#141819] rounded-[40px] opacity-40 pointer-events-none" />
            <div className="absolute inset-x-0 inset-y-8 border border-[#141819] rounded-[60px] opacity-20 pointer-events-none" />
            
            {/* Directional Hazard Highlight Zones */}
            <div className={`absolute top-4 left-1/4 right-1/4 h-1/4 border-t border-l border-r rounded-t-[50px] transition-all duration-500 pointer-events-none ${getZoneColor(frontHazard)}`} />
            <div className={`absolute bottom-4 left-1/4 right-1/4 h-1/4 border-b border-l border-r rounded-b-[50px] transition-all duration-500 pointer-events-none ${getZoneColor(rearHazard)}`} />
            <div className={`absolute left-4 top-1/4 bottom-1/4 w-1/4 border-l border-t border-b rounded-l-[50px] transition-all duration-500 pointer-events-none ${getZoneColor(leftHazard)}`} />
            <div className={`absolute right-4 top-1/4 bottom-1/4 w-1/4 border-r border-t border-b rounded-r-[50px] transition-all duration-500 pointer-events-none ${getZoneColor(rightHazard)}`} />

            {/* Radar Objects */}
            {proximityData.map((obj: any, i: number) => {
              const angleRad = (obj.angle - 90) * (Math.PI / 180);
              const r = Math.min((obj.distanceM / 20) * 50, 50); // Map up to 20m out to 50% radius
              const top = 50 + r * Math.sin(angleRad);
              const left = 50 + r * Math.cos(angleRad);
              
              const isObjCritical = obj.status === 'critical';
              const isObjWarning = obj.status === 'warning';
              const objColor = isObjCritical ? '#E5484D' : isObjWarning ? '#F2B84B' : '#42C76A';

              // Quadrant based label offset engine
              const isLeft = obj.angle > 180 && obj.angle < 360;
              
              return (
                <div 
                  key={i} 
                  className="absolute flex items-center gap-2 transition-all duration-300 ease-in-out"
                  style={{ 
                    top: `${top}%`, 
                    left: `${left}%`,
                    flexDirection: isLeft ? 'row-reverse' : 'row',
                    transform: `translate(${isLeft ? '50%' : '-50%'}, -50%)`
                  }}
                >
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border z-20 shrink-0 bg-[#080A0B] ${isObjCritical ? 'animate-pulse' : ''}`} style={{ borderColor: objColor }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: objColor }} />
                  </div>
                  
                  <div className={`flex flex-col ${isLeft ? 'items-end text-right' : 'items-start text-left'} z-30 bg-[#080A0B]/90 px-2 py-1 rounded border border-[#141819]`}>
                    <span className="font-mono text-[10px] text-[#929A9E] uppercase leading-none mb-1">
                      {obj.label}
                    </span>
                    <span className="font-mono text-xs font-bold" style={{ color: objColor }}>
                      {obj.distanceM}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center font-mono text-xs text-[#5E676C] font-bold tracking-widest mt-4">↓<br/>REAR</div>
          
          {/* Nearest readout - OEM Instrumentation Style */}
          <div className="w-full mt-auto flex justify-between items-end border-t border-[#141819] pt-4 font-mono uppercase tracking-widest max-w-[400px]">
            <div className="flex flex-col gap-1">
              <span className="text-[#5E676C] text-[10px] font-bold">PROXIMITY</span>
              <span className="text-[#42C76A] text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42C76A] animate-pulse" /> 360° ACTIVE
              </span>
            </div>
            
            {nearest ? (
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-[#5E676C] text-[10px] font-bold">NEAREST HAZARD</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-extrabold ${nearest.status === 'critical' ? 'text-[#E5484D]' : nearest.status === 'warning' ? 'text-[#F2B84B]' : 'text-[#F1F3F4]'}`}>
                    {nearest.distanceM}m
                  </span>
                  <span className="text-[#929A9E] text-xs shrink-0">• {nearest.label}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-[#5E676C] text-[10px] font-bold">NEAREST HAZARD</span>
                <span className="text-[#929A9E] text-sm font-bold">CLEAR</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ALERTS & HISTORY */}
        <div className="w-1/4 flex flex-col h-full pb-4 border-l border-[#141819] pl-8 lg:pl-16 shrink-0">
          
          {/* ALERTS */}
          <div className="flex flex-col flex-1 min-h-0">
            <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold mb-6">
              ACTIVE ALERTS
            </span>
            
            <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin pr-2">
              {alerts.length > 0 ? (
                alerts.map((alert: any) => {
                  const isCrit = alert.severity.toLowerCase() === 'critical';
                  const color = isCrit ? 'text-[#E5484D]' : 'text-[#F2B84B]';
                  return (
                    <div key={alert.alert_id} className="flex flex-col gap-1 border-l-2 pl-3 py-1" style={{ borderColor: isCrit ? '#E5484D' : '#F2B84B' }}>
                      <span className={`font-mono text-sm font-bold tracking-widest uppercase ${color}`}>
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-xs text-[#929A9E] tracking-widest uppercase">
                        {alert.message}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center py-2">
                  <span className="font-mono text-sm text-[#5E676C] tracking-widest uppercase font-bold">
                    NO ACTIVE SAFETY ALERTS
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-[#141819] my-6" />

          {/* HISTORY */}
          <div className="flex flex-col flex-1 min-h-0">
            <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold mb-6">
              RECENT EVENTS
            </span>
            
            <div className="flex flex-col gap-6 overflow-hidden">
              {events.slice(0, 2).map((ev: any) => (
                <div key={ev.event_id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between font-mono tracking-widest uppercase">
                    <span className="text-xs text-[#929A9E] font-bold">{ev.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-[#5E676C]">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#5E676C] uppercase truncate">{ev.description}</span>
                </div>
              ))}
              {events.length === 0 && (
                <span className="font-mono text-sm text-[#5E676C] tracking-widest uppercase font-bold">
                  NO RECENT EVENTS
                </span>
              )}
            </div>
          </div>

          {/* Contextual AI Action */}
          <div className="mt-auto pt-6">
            <button 
              onClick={() => navigate(`/assist?question=${encodeURIComponent(isCritical ? 'Explain the current critical safety hazard' : isCaution ? 'Explain the current safety caution and what action I should take' : alerts.length > 0 ? `Explain the ${alerts[0].alert_type.replace(/_/g, ' ')} safety alert and what I should do` : nearest ? `An obstacle is detected ${nearest.distanceM} meters away. What should I do?` : 'Explain the current safety condition and what action I should take')}`, { state: { autoSubmit: true } })}
              className="group flex flex-col gap-1 cursor-pointer outline-none w-full text-left"
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#FFCC00]">
                <span>✦ ASK ASSIST</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">→</span>
              </div>
              <span className="font-mono text-sm tracking-widest text-[#929A9E] group-hover:text-[#F1F3F4] transition-colors uppercase">
                {isCritical || isCaution ? 'Explain the active hazard' : 'Why was this safety event triggered?'}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
