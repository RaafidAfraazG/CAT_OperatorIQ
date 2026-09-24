import { useState, useEffect, useCallback } from 'react';
import {
  Shield, AlertTriangle, User, Truck, Box, CheckCircle2, XCircle, AlertCircle, Brain,
  ChevronUp, ChevronDown, Cone, Car
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import type { IncidentReport, IncidentType, IncidentSeverity } from '../types';
import { api } from '../api/client';

// ─── Scene geometry constants ────────────────────────────────
// Scene is a 320×300 coordinate space (px); machine moves vertically.
const SCENE_W = 320;
const SCENE_H = 300;
const MACHINE_INIT_Y = 70;   // machine starts near top-centre
const MACHINE_X = SCENE_W / 2;
const STEP_PX = 18;           // pixels per button press
const MIN_Y = 24;
const MAX_Y = SCENE_H - 36;

// Scale factor: 1 px = 0.18 m (so 300 px ≈ 54 m scene width)
const PX_PER_M = 5.6;

// ─── Static scene objects ────────────────────────────────────
interface SceneObject {
  id: string;
  label: string;
  type: 'worker' | 'vehicle' | 'obstacle' | 'person';
  x: number;      // px in scene coords
  y: number;      // px in scene coords
  thresholdM: number;   // danger distance in metres
  icon: React.ComponentType<any>;
  baseColor: string;      // Tailwind/inline colour when safe
}

const SCENE_OBJECTS: SceneObject[] = [
  { id: 'worker-a',   label: 'Worker A',        type: 'person',   x: 90,  y: 180, thresholdM: 6,  icon: User,    baseColor: '#42C76A' },
  { id: 'worker-b',   label: 'Worker B',        type: 'person',   x: 240, y: 220, thresholdM: 5,  icon: User,    baseColor: '#42C76A' },
  { id: 'haul-truck', label: 'Haul Truck',      type: 'vehicle',  x: 50,  y: 80,  thresholdM: 9,  icon: Truck,   baseColor: '#F2B84B' },
  { id: 'vehicle-b',  label: 'Vehicle B',       type: 'vehicle',  x: 270, y: 110, thresholdM: 7,  icon: Car,     baseColor: '#F2B84B' },
  { id: 'exc-edge',   label: 'Exc. Edge',       type: 'obstacle', x: 160, y: 270, thresholdM: 8,  icon: Box,     baseColor: '#5B8DEF' },
  { id: 'cone',       label: 'Cone Zone',       type: 'obstacle', x: 200, y: 55,  thresholdM: 4,  icon: Box,     baseColor: '#5B8DEF' },
];

function distancePx(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ─── Interactive ProximityMap ─────────────────────────────────
function ProximityMap({ machineId, risk }: { machineId: string; risk: any }) {
  const [machineY, setMachineY] = useState(MACHINE_INIT_Y);
  const [tick, setTick] = useState(0);   // for blinking
  const [blink, setBlink] = useState(false);

  // Blinking ticker at 600 ms
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(id);
  }, []);

  const moveUp   = useCallback(() => setMachineY(y => Math.max(MIN_Y, y - STEP_PX)), []);
  const moveDown = useCallback(() => setMachineY(y => Math.min(MAX_Y, y + STEP_PX)), []);

  // Define the configurable safety boundary radius for the machine
  const MACHINE_PROX_RADIUS_M = 8.0;
  const MACHINE_PROX_RADIUS_PX = MACHINE_PROX_RADIUS_M * PX_PER_M;
  const OBJECT_RADIUS_PX = 12; // Matches the <circle r={12}> of the objects

  // Compute live state for each scene object
  const liveObjects = SCENE_OBJECTS.map(obj => {
    const distPx = distancePx(MACHINE_X, machineY, obj.x, obj.y);
    const distM  = distPx / PX_PER_M;
    
    // Exact visual intersection: distance between centers <= sum of radii
    const inDanger = distPx <= (MACHINE_PROX_RADIUS_PX + OBJECT_RADIUS_PX);
    
    return { ...obj, distM: +distM.toFixed(1), inDanger };
  });

  const anyDanger = liveObjects.some(o => o.inDanger);

  // Audio Alarm Effect
  useEffect(() => {
    if (!anyDanger) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    let isPlaying = true;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    
    const playBeep = () => {
      if (!isPlaying || audioCtx.state === 'closed') return;
      
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      
      // High-pitched square wave for industrial alarm sound
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      
      // Volume envelope to avoid popping clicks
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.25);
    };

    // Play a beep every 600ms (matching the visual blink rate)
    const intervalId = setInterval(playBeep, 600);
    playBeep(); // Play first beep immediately

    return () => {
      isPlaying = false;
      clearInterval(intervalId);
      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(console.error);
      }
    };
  }, [anyDanger]);

  // Machine Y position as percentage for smooth CSS transition
  const machineTopPct = (machineY / SCENE_H) * 100;

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Shield size={16} className="text-surface-400" />
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-surface-100">Proximity Monitor — Interactive Demo</h2>
          <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Live proximity zone</span>
        </div>
        {risk && (
          <StatusBadge
            status={risk.risk_level === 'High' ? 'critical' : risk.risk_level === 'Medium' ? 'warning' : 'safe'}
            className="ml-auto"
          >
            AI Assessed: {risk.risk_level.toUpperCase()}
          </StatusBadge>
        )}
      </div>

      {/* ── Overall hazard banner ── */}
      {anyDanger && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold"
          style={{
            background: 'rgba(229,72,77,0.15)',
            border: '1px solid rgba(229,72,77,0.55)',
            color: '#E5484D',
            opacity: blink ? 1 : 0.55,
            transition: 'opacity 0.25s',
          }}
        >
          <AlertTriangle size={15} />
          PROXIMITY HAZARD DETECTED — STOP OR REDUCE SPEED
        </div>
      )}

      {/* ── Scene + Controls layout ── */}
      <div className="flex items-start gap-3">

        {/* UP / DOWN controls */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          <button
            id="prox-move-up"
            onClick={moveUp}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: '#1D2225', border: '1px solid #384146', color: '#fbbf24', minWidth: 40 }}
            title="Move machine UP"
          >
            <ChevronUp size={20} strokeWidth={2.5} />
            <span style={{ fontSize: 10 }}>UP</span>
          </button>
          <span className="text-xs font-mono" style={{ color: '#687176' }}>
            {(machineY / PX_PER_M).toFixed(0)}m
          </span>
          <button
            id="prox-move-down"
            onClick={moveDown}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: '#1D2225', border: '1px solid #384146', color: '#fbbf24', minWidth: 40 }}
            title="Move machine DOWN"
          >
            <ChevronDown size={20} strokeWidth={2.5} />
            <span style={{ fontSize: 10 }}>DN</span>
          </button>
        </div>

        {/* ── SVG Scene ── */}
        <div className="relative flex-1" style={{ minWidth: 0 }}>
          <svg
            viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
            width="100%"
            style={{
              background: '#0D1214',
              borderRadius: 10,
              border: '1px solid #2A3033',
              display: 'block',
            }}
          >
            {/* Ground grid lines */}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * (SCENE_H / 8)} x2={SCENE_W} y2={(i + 1) * (SCENE_H / 8)}
                stroke="#1D2225" strokeWidth={1} />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * (SCENE_W / 10)} y1={0} x2={(i + 1) * (SCENE_W / 10)} y2={SCENE_H}
                stroke="#1D2225" strokeWidth={1} />
            ))}

            {/* Excavation edge band at bottom */}
            <rect x={0} y={SCENE_H - 18} width={SCENE_W} height={18} fill="#1a2030" opacity={0.7} />
            <line x1={0} y1={SCENE_H - 18} x2={SCENE_W} y2={SCENE_H - 18} stroke="#384146" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={SCENE_W / 2} y={SCENE_H - 5} textAnchor="middle" fill="#4a536b" fontSize={9} fontFamily="monospace">
              ← EXCAVATION EDGE →
            </text>

            {/* Scene objects */}
            {liveObjects.map(obj => {
              const danger = obj.inDanger;
              const showBlink = danger && !blink;

              // Threshold ring colour
              const ringColor = danger ? '#E5484D' : obj.type === 'person' ? '#42C76A55' : obj.type === 'vehicle' ? '#F2B84B55' : '#5B8DEF55';
              const ringStroke = danger ? (blink ? '#E5484D' : '#E5484D88') : ringColor;
              const iconColor  = danger ? '#E5484D' : obj.baseColor;
              const bgFill     = danger ? (blink ? 'rgba(229,72,77,0.25)' : 'rgba(229,72,77,0.08)') : 'rgba(0,0,0,0.35)';
              const thresholdPx = obj.thresholdM * PX_PER_M;

              return (
                <g key={obj.id}>
                  {/* Threshold ring */}
                  <circle
                    cx={obj.x} cy={obj.y} r={thresholdPx}
                    fill="none"
                    stroke={ringStroke}
                    strokeWidth={danger ? (blink ? 1.5 : 0.8) : 0.8}
                    strokeDasharray={danger ? '4 3' : '3 4'}
                    opacity={danger ? 1 : 0.5}
                    style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
                  />

                  {/* Object body circle */}
                  <circle
                    cx={obj.x} cy={obj.y} r={12}
                    fill={bgFill}
                    stroke={iconColor}
                    strokeWidth={danger ? (blink ? 2.5 : 1.5) : 1.2}
                    style={{ transition: 'stroke 0.25s, stroke-width 0.25s, fill 0.25s' }}
                  />

                  {/* Icon text (emoji-like symbols via text) */}
                  <text x={obj.x} y={obj.y + 4} textAnchor="middle" fill={iconColor} fontSize={11} fontFamily="monospace" fontWeight="bold"
                    style={{ transition: 'fill 0.25s' }}>
                    {obj.type === 'person' ? '🧑' : obj.type === 'vehicle' ? '🚛' : '⬛'}
                  </text>

                  {/* Warning exclamation when in danger */}
                  {danger && blink && (
                    <text x={obj.x + 11} y={obj.y - 9} textAnchor="middle" fill="#E5484D" fontSize={13} fontWeight="bold">!</text>
                  )}

                  {/* Label */}
                  <text x={obj.x} y={obj.y + 23} textAnchor="middle" fill={danger ? '#E5484D' : '#A7AFB3'} fontSize={8} fontFamily="monospace"
                    style={{ transition: 'fill 0.25s' }}>
                    {obj.label}
                  </text>

                  {/* Distance label */}
                  <text x={obj.x} y={obj.y + 32} textAnchor="middle" fill={danger ? '#E5484D' : '#687176'} fontSize={8} fontFamily="monospace"
                    style={{ transition: 'fill 0.25s' }}>
                    {obj.distM}m
                  </text>
                </g>
              );
            })}

            {/* Machine path ghost line (vertical) */}
            <line x1={MACHINE_X} y1={MIN_Y} x2={MACHINE_X} y2={MAX_Y}
              stroke="#fbbf2420" strokeWidth={1} strokeDasharray="3 4" />

            {/* CAT Machine marker */}
            <g style={{ transition: 'transform 0.25s ease-out', transform: `translateY(${machineY - MACHINE_INIT_Y}px)` }}>
              {/* Configurable Proximity Safety Ring */}
              <circle cx={MACHINE_X} cy={MACHINE_INIT_Y} r={MACHINE_PROX_RADIUS_PX}
                fill={anyDanger ? (blink ? 'rgba(229,72,77,0.15)' : 'rgba(229,72,77,0.05)') : 'rgba(66,199,106,0.08)'}
                stroke={anyDanger ? '#E5484D' : '#42C76A'}
                strokeWidth={anyDanger ? (blink ? 3 : 2) : 2}
                style={{ transition: 'stroke 0.25s, fill 0.25s, stroke-width 0.25s' }}
              />
              {/* Machine body */}
              <rect x={MACHINE_X - 12} y={MACHINE_INIT_Y - 10} width={24} height={20} rx={3}
                fill={anyDanger ? (blink ? 'rgba(229,72,77,0.3)' : 'rgba(229,72,77,0.12)') : 'rgba(251,191,36,0.2)'}
                stroke={anyDanger ? '#E5484D' : '#fbbf24'}
                strokeWidth={1.5}
                style={{ transition: 'fill 0.25s, stroke 0.25s' }}
              />
              {/* CAT label */}
              <text x={MACHINE_X} y={MACHINE_INIT_Y + 3} textAnchor="middle"
                fill={anyDanger ? '#E5484D' : '#fbbf24'}
                fontSize={8} fontFamily="monospace" fontWeight="bold"
                style={{ transition: 'fill 0.25s' }}>
                CAT
              </text>
              {/* Direction arrow up */}
              <text x={MACHINE_X} y={MACHINE_INIT_Y - 18} textAnchor="middle" fill="#fbbf2488" fontSize={10}>▲</text>
            </g>

            {/* Legend */}
            <g>
              <circle cx={10} cy={SCENE_H - 32} r={4} fill="none" stroke="#42C76A" strokeWidth={1} />
              <text x={17} y={SCENE_H - 28} fill="#687176" fontSize={7} fontFamily="monospace">Person</text>
              <circle cx={55} cy={SCENE_H - 32} r={4} fill="none" stroke="#F2B84B" strokeWidth={1} />
              <text x={62} y={SCENE_H - 28} fill="#687176" fontSize={7} fontFamily="monospace">Vehicle</text>
              <circle cx={105} cy={SCENE_H - 32} r={4} fill="none" stroke="#5B8DEF" strokeWidth={1} />
              <text x={112} y={SCENE_H - 28} fill="#687176" fontSize={7} fontFamily="monospace">Obstacle</text>
            </g>
          </svg>

          <p className="text-xs mt-1 text-center" style={{ color: '#4a536b', fontFamily: 'monospace' }}>
            Use ↑ UP / ↓ DN to move the CAT machine and trigger proximity alerts
          </p>
        </div>
      </div>

      {/* ── Per-object indicator cards (bottom grid) ── */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {liveObjects.map(obj => {
          const Icon = obj.icon;
          const danger = obj.inDanger;
          const status = danger ? 'critical' : 'safe';
          const borderColor = danger ? 'border-status-critical' : 'border-status-safe';
          const bgColor     = danger ? 'bg-status-criticalD/10' : 'bg-status-safeD/10';
          const textColor   = danger ? 'text-status-critical' : 'text-status-safe';

          return (
            <div
              key={obj.id}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${borderColor} ${bgColor} ${textColor}`}
              style={{
                opacity: danger && !blink ? 0.7 : 1,
                transition: 'opacity 0.25s, border-color 0.3s, background 0.3s',
              }}
            >
              <Icon size={18} />
              <span className="text-xs font-semibold text-center leading-tight">{obj.label}</span>
              <span className="text-xs font-mono">{obj.distM} m</span>
              <StatusBadge status={status} dot={false}>
                {danger ? 'HAZARD' : 'SAFE'}
              </StatusBadge>
            </div>
          );
        })}
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
                   <div className="flex flex-col">
                     <span className="text-surface-200 font-bold">Overall Safety Risk</span>
                     <span className="text-[10px] text-surface-400 mt-0.5">Overall risk • behavior + safety history + current conditions</span>
                   </div>
                   <span className={`font-bold text-lg font-mono ${risk?.score >= 80 || risk?.risk_score <= 20 ? 'text-status-safe' : 'text-status-warn'}`}>
                     {Math.round(risk?.score || risk?.risk_score || 100)} / 100
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
