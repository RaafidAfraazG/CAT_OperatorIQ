import React, { useState, useEffect } from 'react';
import { Wifi, AlertTriangle, Lock } from 'lucide-react';
import OperatorIQLogo from './OperatorIQLogo';
import { useDemoMode } from '../../context/DemoModeContext';
import { useAuth } from '../../context/AuthContext';

interface HMITopBarProps {
  machine?: any;
  activeAlertsCount?: number;
  onOpenProfile: () => void;
}

export default function HMITopBar({
  machine,
  activeAlertsCount = 0,
  onOpenProfile,
}: HMITopBarProps) {
  const [timeStr, setTimeStr] = useState('');
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const { logout } = useAuth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const machineModel = machine?.machine_model || machine?.model || 'EX-140GC';

  return (
    <header className="h-12 bg-[rgba(13,16,17,0.82)] backdrop-blur-[10px] border-b border-[rgba(255,255,255,0.055)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.015)] px-6 flex items-center justify-between shrink-0 select-none z-30 font-mono text-xs tracking-widest font-bold uppercase">
      
      {/* 1. Left: Logo & Machine */}
      <div className="flex items-center gap-6 pl-1 shrink-0">
        <button 
          onClick={onOpenProfile} 
          className="flex items-center justify-start cursor-pointer opacity-95 hover:opacity-100 transition-opacity"
          title="Operator Profile"
        >
          <OperatorIQLogo />
        </button>

        <div className="h-4 w-px bg-[#141819] hidden sm:block" />

        <div className="flex items-center text-[#F1F3F4]">
          {machineModel}
        </div>
      </div>

      {/* 2. Center: Mode & Simulation Indicator */}
      <div className="flex items-center justify-center px-4">
        {isDemoMode ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-[#FFCC00]/10 border border-[#FFCC00]/30 shadow-[0_0_12px_rgba(255,204,0,0.15)] text-[#FFCC00]">
            <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse shadow-[0_0_6px_#FFCC00]" />
            <span className="text-[11px] font-mono font-extrabold tracking-widest uppercase">
              DEMO MODE — SIMULATED TELEMETRY
            </span>
          </div>
        ) : (
          <div className="text-[#929A9E] text-[11px] tracking-widest">
            STANDARD
          </div>
        )}
      </div>

      {/* 3. Right: Connectivity, Time & DEMO Toggle Button */}
      <div className="flex items-center gap-5 shrink-0 pr-1">
        {/* Connectivity */}
        <div className="hidden md:flex items-center gap-2 text-[#42C76A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#42C76A]" />
          ONLINE
        </div>

        {/* Time */}
        <div className="text-[#F1F3F4] text-sm tracking-tight hidden sm:block">
          {timeStr || '10:42 AM'}
        </div>

        {/* DEMO Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDemoMode}
          title={isDemoMode ? "Click to disable Demo Mode and return to real backend" : "Click to enable Demo Mode (simulated live telemetry stream)"}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-mono font-extrabold tracking-widest uppercase transition-all duration-200 cursor-pointer ${
            isDemoMode
              ? 'bg-[#FFCC00] text-[#080A0B] border border-[#FFCC00] shadow-[0_0_12px_rgba(255,204,0,0.35)] hover:bg-[#FFD633]'
              : 'bg-[#141819] text-[#929A9E] border border-[#5E676C]/40 hover:text-[#F1F3F4] hover:border-[#929A9E]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#080A0B] animate-ping' : 'bg-[#5E676C]'}`} />
          <span>{isDemoMode ? 'DEMO ON' : 'DEMO'}</span>
        </button>

        {/* Lock Cab Button */}
        <button
          type="button"
          onClick={logout}
          title="Lock Cab Terminal (requires 6-digit access code 123456 to unlock)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase bg-[#141819] text-[#929A9E] border border-[#5E676C]/40 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all duration-200 cursor-pointer"
        >
          <Lock className="w-3 h-3 text-[#FFCC00]" />
          <span className="hidden xl:inline">LOCK</span>
        </button>
      </div>

    </header>
  );
}
