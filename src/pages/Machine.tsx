import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
} from 'recharts';
import { Cpu, Thermometer, Gauge, Droplets, Zap, Activity } from 'lucide-react';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../api/client';

// ─── Custom Tooltip ────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-surface-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono font-semibold text-brand-400">
          {p.value} {unit}
        </p>
      ))}
    </div>
  );
}

// ─── Telemetry card ────────────────────────────────────────

interface TelCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  status?: 'safe' | 'warning' | 'critical' | 'neutral';
}

function TelCard({ label, value, unit, icon, status = 'neutral' }: TelCardProps) {
  const borderMap = {
    safe:     'border-l-2 border-l-status-safe',
    warning:  'border-l-2 border-l-status-warn',
    critical: 'border-l-2 border-l-status-critical',
    neutral:  '',
  };
  return (
    <Card className={`p-4 ${borderMap[status]}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs text-surface-400">{label}</span>
        <span className="text-surface-500">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono text-surface-50">{value}</span>
        <span className="text-sm text-surface-400">{unit}</span>
      </div>
    </Card>
  );
}

export default function Machine() {
  const [machine, setMachine] = useState<any>(null);
  const [currentTel, setCurrentTel] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const machines = await api.getMachines();
        if (machines.length === 0) throw new Error("No machines found");
        
        const selectedMachine = machines[0];
        setMachine(selectedMachine);

        const telData = await api.getTelemetry(selectedMachine.machine_id, 15);
        if (telData.length > 0) {
          setCurrentTel(telData[0]);
          
          // Reverse for chronological order on charts
          const mappedHistory = telData.map((t: any) => ({
            timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            engineRpm: t.engine_rpm,
            engineLoadPct: t.engine_load_percent,
            fuelConsumptionLph: t.fuel_rate_lph,
            coolantTempC: t.coolant_temperature_c,
            fuelLevelPct: t.fuel_level_percent,
            hydraulicPressureBar: t.hydraulic_pressure_bar,
            speedKmh: t.machine_speed_kmh,
          })).reverse();
          
          setHistory(mappedHistory);
        }
      } catch (err) {
        setError('Unable to load data. Please check that the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="text-surface-400 p-8 text-center">Loading machine data...</div>;
  if (error) return <div className="text-status-critical p-8 text-center">{error}</div>;
  if (!machine || !currentTel) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Machine Insights</h1>
          <p className="text-sm text-surface-400 mt-1">
            Live telemetry for <span className="text-surface-200 font-medium">{machine.machine_model}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={machine.status === 'Active' ? 'safe' : 'warning'}>
            Status: {machine.status.toUpperCase()}
          </StatusBadge>
          <StatusBadge status="info">
            State: {currentTel.operating_state}
          </StatusBadge>
        </div>
      </div>

      {/* Machine info card */}
      <Card className="p-5">
        <p className="section-label mb-3">Machine Information</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Model',         value: machine.machine_model      },
            { label: 'Machine ID',    value: machine.machine_id         },
            { label: 'Machine Age',   value: `${Math.round(machine.machine_age_years)} years` },
            { label: 'Engine Hours',  value: `${Math.round(currentTel.engine_hours).toLocaleString()} h` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-surface-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold font-mono text-surface-100">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Telemetry grid */}
      <section aria-label="Live Telemetry">
        <p className="section-label mb-3">Live Telemetry</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <TelCard label="Engine RPM"  value={Math.round(currentTel.engine_rpm).toLocaleString()} unit="rpm"  icon={<Zap size={15} />}         status="neutral" />
          <TelCard label="Engine Load" value={Math.round(currentTel.engine_load_percent)}         unit="%"    icon={<Activity size={15} />}    status={currentTel.engine_load_percent > 80 ? 'warning' : 'neutral'} />
          <TelCard label="Hyd. Press." value={Math.round(currentTel.hydraulic_pressure_bar)}      unit="bar"  icon={<Gauge size={15} />}       status="neutral" />
          <TelCard label="Coolant"     value={Math.round(currentTel.coolant_temperature_c)}       unit="°C"   icon={<Thermometer size={15} />} status={currentTel.coolant_temperature_c > 95 ? 'critical' : currentTel.coolant_temperature_c > 90 ? 'warning' : 'neutral'} />
          <TelCard label="Fuel Level"  value={Math.round(currentTel.fuel_level_percent)}          unit="%"    icon={<Droplets size={15} />}    status={currentTel.fuel_level_percent < 20 ? 'critical' : currentTel.fuel_level_percent < 40 ? 'warning' : 'safe'} />
          <TelCard label="Speed"       value={Math.round(currentTel.machine_speed_kmh)}           unit="km/h" icon={<Cpu size={15} />}         status="neutral" />
        </div>
      </section>

      {/* Charts */}
      <section aria-label="Telemetry Charts">
        <p className="section-label mb-3">Telemetry History</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Engine RPM */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-surface-100 mb-1">Engine RPM</h2>
            <p className="text-xs text-surface-500 mb-4">Last 10 readings</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#8691a0' }} />
                <YAxis domain={[1000, 2200]} tick={{ fontSize: 10, fill: '#8691a0' }} />
                <Tooltip content={<ChartTooltip unit="rpm" />} />
                <Line
                  type="monotone"
                  dataKey="engineRpm"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Fuel Consumption */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-surface-100 mb-1">Fuel Consumption</h2>
            <p className="text-xs text-surface-500 mb-4">L/h over time</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#8691a0' }} />
                <YAxis domain={[8, 22]} tick={{ fontSize: 10, fill: '#8691a0' }} />
                <Tooltip content={<ChartTooltip unit="L/h" />} />
                <defs>
                  <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="fuelConsumptionLph"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#fuelGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Engine Load */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-surface-100 mb-1">Engine Load</h2>
            <p className="text-xs text-surface-500 mb-4">% over time</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#8691a0' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8691a0' }} />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <defs>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="engineLoadPct"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#loadGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>
    </div>
  );
}
