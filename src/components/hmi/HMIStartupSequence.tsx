import React, { useState, useEffect } from 'react';

interface HMIStartupSequenceProps {
  operatorName?: string;
  onComplete: () => void;
}

export default function HMIStartupSequence({
  operatorName = 'ALEX MORGAN',
  onComplete,
}: HMIStartupSequenceProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 0ms: Initial splash
    const t1 = setTimeout(() => setStep(1), 400);  // Diagnostics start
    const t2 = setTimeout(() => setStep(2), 800);  // Diagnostics complete
    const t3 = setTimeout(() => setStep(3), 1200); // Operator greeting
    const t4 = setTimeout(() => onComplete(), 1800); // Complete & transition

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#080A0B] flex flex-col items-center justify-center select-none font-mono tracking-widest uppercase">
      {/* Container */}
      <div className="relative w-full max-w-lg p-8 flex flex-col items-center text-center">
        
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-black text-[#FFCC00] text-xl">CAT</span>
            <span className="font-extrabold text-[#F1F3F4] text-xl">OPERATORIQ</span>
          </div>
          <p className="text-[#929A9E] font-bold">EX-140GC</p>
        </div>

        <div className="w-full h-px bg-[#141819] mb-8" />

        <div className="w-full text-left max-w-xs mx-auto mb-10">
          <p className="text-[#F1F3F4] font-bold mb-6">SYSTEM CHECK</p>
          
          <div className="space-y-4 text-sm">
            <div className={`flex items-center justify-between transition-opacity duration-200 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#5E676C]">Machine systems ........</span>
              <span className={`font-bold ${step >= 2 ? 'text-[#42C76A]' : 'text-[#929A9E] animate-pulse'}`}>
                {step >= 2 ? 'READY' : 'WAIT'}
              </span>
            </div>

            <div className={`flex items-center justify-between transition-opacity duration-200 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#5E676C]">Telematics .............</span>
              <span className={`font-bold ${step >= 2 ? 'text-[#42C76A]' : 'text-[#929A9E] animate-pulse'}`}>
                {step >= 2 ? 'ONLINE' : 'WAIT'}
              </span>
            </div>

            <div className={`flex items-center justify-between transition-opacity duration-200 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#5E676C]">Safety system ..........</span>
              <span className={`font-bold ${step >= 2 ? 'text-[#42C76A]' : 'text-[#929A9E] animate-pulse'}`}>
                {step >= 2 ? 'ACTIVE' : 'WAIT'}
              </span>
            </div>
          </div>
        </div>

        {/* Welcome Salutation */}
        <div className={`transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[#929A9E] text-xs mb-2">WELCOME BACK</p>
          <p className="text-2xl font-extrabold text-[#F1F3F4]">
            {operatorName}
          </p>
        </div>

        {/* Skip button for development */}
        <button
          type="button"
          onClick={onComplete}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] text-[#5E676C] hover:text-[#929A9E] transition-colors cursor-pointer"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
