import React, { useState, useEffect } from 'react';
import { Wifi, AlertTriangle } from 'lucide-react';
import OperatorIQLogo from './OperatorIQLogo';

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
    <header className="h-12 bg-[rgba(13,16,17,0.82)] backdrop-blur-[10px] border-b border-[rgba(255,255,255,0.055)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.015)] px-6 grid grid-cols-5 items-center shrink-0 select-none z-30 font-mono text-xs tracking-widest font-bold uppercase">
      
      {/* 1. Logo */}
      <div className="flex items-center justify-start h-full pl-1">
        <button 
          onClick={onOpenProfile} 
          className="flex items-center justify-start cursor-pointer opacity-95 hover:opacity-100 transition-opacity"
          title="Operator Profile"
        >
          <OperatorIQLogo />
        </button>
      </div>

      {/* 2. Machine */}
      <div className="flex items-center justify-center h-full text-[#F1F3F4]">
        {machineModel}
      </div>

      {/* 3. Mode */}
      <div className="flex items-center justify-center h-full text-[#F1F3F4]">
        STANDARD
      </div>

      {/* 4. Connectivity */}
      <div className="flex items-center justify-center gap-2 h-full text-[#42C76A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#42C76A]" />
        ONLINE
      </div>

      {/* 5. Time */}
      <div className="flex items-center justify-center h-full text-[#F1F3F4] text-sm tracking-tight">
        {timeStr || '10:42 AM'}
      </div>

    </header>
  );
}
