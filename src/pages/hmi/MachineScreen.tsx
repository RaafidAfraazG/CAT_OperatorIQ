import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../../api/client';

export default function MachineScreen() {
  const navigate = useNavigate();

  const [machine, setMachine] = useState<any>(null);
  const [currentTel, setCurrentTel] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [fuel, setFuel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const machines = await api.getMachines();
        if (machines.length > 0) {
          const selectedMachine = machines[0];
          setMachine(selectedMachine);

          const [telData, fuelData] = await Promise.all([
            api.getTelemetry(selectedMachine.machine_id, 30).catch(() => []),
            api.getFuelAnomaly(selectedMachine.machine_id).catch(() => null)
          ]);

          if (telData.length > 0) {
            setCurrentTel(telData[0]);
            
            const mappedHistory = telData.map((t: any) => ({
              timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              engineRpm: t.engine_rpm,
            })).reverse();
            setHistory(mappedHistory);
          }
          
          if (fuelData) {
            setFuel(fuelData);
          }
        }
      } catch (err) {
        console.error('Failed to load MACHINE data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Telemetry fallback defaults
  const rpm = currentTel?.engine_rpm ?? 1745;
  const loadPct = currentTel?.engine_load_percent ?? 91;
  const coolantTemp = currentTel?.coolant_temperature_c ?? 78;
  const hydPress = currentTel?.hydraulic_pressure_bar ?? 238;
  const fuelLvl = currentTel?.fuel_level_percent ?? 63;
  const fuelRate = currentTel?.fuel_rate_lph ?? 17.0;

  // Machine Anomaly logic
  const isCriticalAnomaly = machine?.anomaly_score > 0.8 || machine?.status === 'Critical';
  const isAttentionAnomaly = machine?.anomaly_score > 0.6 || machine?.status === 'Attention';
  const machineHealthStr = isCriticalAnomaly ? 'CRITICAL' : isAttentionAnomaly ? 'ATTENTION REQUIRED' : 'NORMAL';
  const machineHealthColor = isCriticalAnomaly ? 'text-[#E5484D]' : isAttentionAnomaly ? 'text-[#F2B84B]' : 'text-[#42C76A]';

  // Fuel Anomaly logic
  const hasFuelAnomaly = fuel && fuel.status !== 'normal';
  const fuelDeviation = fuel?.deviation_percent ? `+${fuel.deviation_percent}%` : null;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4] animate-pulse">CONNECTING TELEMETRY</p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none">
        <p className="text-sm font-bold uppercase tracking-widest text-[#5E676C]">NO MACHINE ASSIGNMENT</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none px-4 py-2 lg:py-4 lg:px-12 overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col justify-between gap-2 lg:gap-4 h-full min-h-0">

        {/* 1. MACHINE STATUS */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-sm tracking-widest text-[#F1F3F4] uppercase font-bold">
            {machine.machine_model || 'EX-140GC'}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
              MACHINE HEALTH
            </span>
            <span className={`font-mono text-2xl lg:text-3xl font-extrabold tracking-tight uppercase ${machineHealthColor}`}>
              {machineHealthStr}
            </span>
          </div>

          {/* Anomaly Score and Signatures (if anomalous) */}
          {(isAttentionAnomaly || isCriticalAnomaly) && (
            <div className="mt-2 flex flex-col gap-1 font-mono text-sm tracking-widest uppercase">
              <div className="flex items-center gap-4">
                <span className="text-[#5E676C]">ANOMALY SCORE</span>
                <span className={`font-bold ${machineHealthColor}`}>{machine.anomaly_score.toFixed(2)} / 1.0</span>
              </div>
              {machine.reasons && machine.reasons.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#5E676C] text-xs">SIGNATURES DETECTED:</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {machine.reasons.map((r: string, idx: number) => (
                      <span key={idx} className={`font-bold text-xs ${machineHealthColor}`}>• {r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-[#141819]" />

        {/* 2. PRIMARY ENGINE INSTRUMENTATION (Horizontal) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
          
          {/* RPM */}
          <div className="flex flex-col items-center text-center">
            <span className="font-mono text-6xl font-extrabold text-[#F1F3F4] tracking-tighter">
              {Math.round(rpm).toLocaleString()}
            </span>
            <span className="font-mono text-sm tracking-widest text-[#929A9E] uppercase mt-1">
              RPM
            </span>
            {/* Subtle Arc decoration */}
            <svg width="80" height="24" viewBox="0 0 80 24" className="mt-3 opacity-40">
              <path d="M 10 24 Q 40 -10 70 24" fill="none" stroke="#F1F3F4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* ENGINE LOAD */}
          <div className="flex flex-col items-center text-center">
            <span className="font-mono text-6xl font-extrabold text-[#F1F3F4] tracking-tighter">
              {Math.round(loadPct)}
            </span>
            <span className="font-mono text-sm tracking-widest text-[#929A9E] uppercase mt-1">
              % LOAD
            </span>
            <svg width="80" height="24" viewBox="0 0 80 24" className="mt-3 opacity-40">
              <path d="M 10 24 Q 40 -10 70 24" fill="none" stroke="#F1F3F4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* COOLANT TEMP */}
          <div className="flex flex-col items-center text-center">
            <span className="font-mono text-6xl font-extrabold text-[#F1F3F4] tracking-tighter">
              {Math.round(coolantTemp)}°
            </span>
            <span className="font-mono text-sm tracking-widest text-[#929A9E] uppercase mt-1">
              COOLANT
            </span>
            <svg width="80" height="24" viewBox="0 0 80 24" className="mt-3 opacity-40">
              <path d="M 10 24 Q 40 -10 70 24" fill="none" stroke="#F1F3F4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* HYDRAULIC PRESSURE */}
          <div className="flex flex-col items-center text-center justify-start pt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-extrabold text-[#F1F3F4] tracking-tighter">
                {Math.round(hydPress)}
              </span>
              <span className="font-mono text-sm text-[#929A9E]">bar</span>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-[#5E676C] uppercase mt-1 mb-3">
              HYDRAULIC PRESSURE
            </span>
            <div className="w-full max-w-[120px] h-1 bg-[#141819] relative rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#FFCC00]" 
                style={{ width: `${Math.min(100, (hydPress / 350) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#141819]" />

        {/* 3. FUEL & HISTORY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 flex-1 min-h-0 items-start mt-2">
          
          {/* FUEL STATE */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs font-bold tracking-widest text-[#5E676C] uppercase">
              FUEL SYSTEM
            </span>
            
            <div className="flex flex-col font-mono text-sm tracking-widest w-full max-w-sm">
              <div className="flex justify-between border-b border-[#141819] pb-2 mb-2">
                <span className="text-[#929A9E]">LEVEL</span>
                <span className="text-[#F1F3F4] font-bold">{Math.round(fuelLvl)}%</span>
              </div>
              <div className="flex justify-between border-b border-[#141819] pb-2 mb-2">
                <span className="text-[#929A9E]">RATE</span>
                <span className="text-[#F1F3F4] font-bold">{fuelRate.toFixed(1)} L/h</span>
              </div>
              
              {fuel && (
                <>
                  <div className="flex justify-between border-b border-[#141819] pb-2 mb-2">
                    <span className="text-[#929A9E]">EXPECTED BASELINE</span>
                    <span className="text-[#F1F3F4] font-bold">{fuel.expected_fuel_rate} L/h</span>
                  </div>
                  <div className="flex justify-between border-b border-[#141819] pb-2 mb-2">
                    <span className="text-[#929A9E]">DEVIATION</span>
                    <span className={`font-bold ${hasFuelAnomaly ? 'text-[#F2B84B]' : 'text-[#42C76A]'}`}>
                      {fuelDeviation || '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-[#929A9E]">IDLE WASTE</span>
                    <span className="text-[#F1F3F4] font-bold">{fuel.idle_fuel} L</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TELEMETRY TREND */}
          <div className="flex flex-col w-full h-full lg:items-end flex-1 min-h-0">
            <span className="text-xs text-[#5E676C] font-mono font-bold tracking-widest uppercase mb-4 lg:text-right w-full block">
              TELEMETRY TREND (RPM)
            </span>

            {history.length > 0 ? (
              <div className="w-full max-w-lg flex-1 min-h-[100px] max-h-[160px] -ml-4 lg:ml-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="timestamp" 
                      tick={{ fontSize: 10, fill: '#5E676C', fontFamily: 'monospace' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 2500]} 
                      tick={{ fontSize: 10, fill: '#5E676C', fontFamily: 'monospace' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0C0F10', borderColor: '#141819', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}
                      itemStyle={{ color: '#FFCC00' }}
                      labelStyle={{ color: '#929A9E', marginBottom: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="engineRpm"
                      name="RPM"
                      stroke="#FFCC00"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#FFCC00', stroke: '#080A0B', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full max-w-lg flex-1 min-h-[100px] max-h-[160px] flex items-center justify-center lg:justify-end border border-[#141819] border-dashed">
                <span className="font-mono text-xs text-[#5E676C] tracking-widest uppercase">HISTORY UNAVAILABLE</span>
              </div>
            )}

            {/* Contextual AI Action */}
            <div className="mt-4 flex w-full justify-end">
              <button 
                onClick={() => navigate(`/assist?question=${encodeURIComponent(machineHealthStr === 'NORMAL' ? `The engine load is ${Math.round(loadPct)}% and RPM is ${Math.round(rpm)}. Explain the current machine trends.` : `Explain the current machine anomaly signatures: ${machine.reasons?.join(', ') || 'unknown'}.`)}`, { state: { autoSubmit: true } })}
                className="group flex flex-col items-end gap-1 cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#FFCC00]">
                  <span>✦ ASK ASSIST</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">→</span>
                </div>
                <span className="font-mono text-sm tracking-widest text-[#929A9E] group-hover:text-[#F1F3F4] transition-colors uppercase">
                  Explain the {machineHealthStr === 'NORMAL' ? 'current trends' : 'anomaly signatures'}
                </span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
