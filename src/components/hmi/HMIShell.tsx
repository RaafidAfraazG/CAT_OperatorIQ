import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import HMITopBar from './HMITopBar';
import HMINavigation from './HMINavigation';
import OperatorProfileOverlay from './OperatorProfileOverlay';
import HMIStartupSequence from './HMIStartupSequence';
import { api } from '../../api/client';

export default function HMIShell() {
  const [showStartup, setShowStartup] = useState(() => {
    // Only show startup sequence once per session
    const hasSeenStartup = sessionStorage.getItem('operatoriq_startup_complete');
    return !hasSeenStartup;
  });
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [operator, setOperator] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  useEffect(() => {
    async function loadGlobalData() {
      try {
        const [ops, machs, alerts] = await Promise.all([
          api.getOperators().catch(() => []),
          api.getMachines().catch(() => []),
          api.getAlerts({ resolved: 'false' }).catch(() => [])
        ]);

        if (ops.length > 0) setOperator(ops[0]);
        if (machs.length > 0) setMachine(machs[0]);
        
        setActiveAlertsCount(alerts.filter((a: any) => !a.resolved).length);
      } catch (err) {
        console.error('Failed to load global HMI data', err);
      }
    }
    loadGlobalData();
    
    // Poll for alerts every 30s
    const interval = setInterval(async () => {
      const alerts = await api.getAlerts({ resolved: 'false' }).catch(() => []);
      setActiveAlertsCount(alerts.filter((a: any) => !a.resolved).length);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartupComplete = () => {
    sessionStorage.setItem('operatoriq_startup_complete', 'true');
    setShowStartup(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] min-h-0 overflow-hidden bg-[#080A0B] text-[#F2F4F5] antialiased">
      {/* 1. Startup Sequence (Conditional) */}
      {showStartup && (
        <HMIStartupSequence 
          operatorName={operator?.operator_name || operator?.name || 'ALEX MORGAN'} 
          onComplete={handleStartupComplete} 
        />
      )}

      {/* 2. Operator Profile Overlay */}
      <OperatorProfileOverlay 
        isOpen={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        operator={operator} 
        machine={machine} 
      />

      {/* 3. Persistent Top Status Bar */}
      <HMITopBar 
        machine={machine} 
        activeAlertsCount={activeAlertsCount} 
        onOpenProfile={() => setProfileOpen(true)} 
      />

      {/* 4. Main Viewport (Outlet) with subtle breathing space */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden bg-[#080A0B] py-2.5">
        <Outlet />
      </main>

      {/* 5. Persistent Bottom Navigation Dock */}
      <HMINavigation />
    </div>
  );
}
