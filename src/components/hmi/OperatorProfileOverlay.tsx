import React from 'react';
import { X } from 'lucide-react';

interface OperatorProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  operator: any;
  machine: any;
}

export default function OperatorProfileOverlay({
  isOpen,
  onClose,
  operator,
  machine,
}: OperatorProfileOverlayProps) {
  if (!isOpen) return null;

  const opName = operator?.operator_name || operator?.name || 'Alex Morgan';
  const opId = operator?.operator_id || 'OP0001';
  const skill = operator?.skill_level || 'Expert';
  const machineModel = machine?.machine_model || machine?.model || 'EX-140GC';
  const machineId = machine?.machine_id || 'M0001';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-[#0C0F10]/90 border border-[#141819] p-10 flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-[#5E676C] hover:text-[#F1F3F4] transition-colors cursor-pointer p-2"
          aria-label="Close profile overlay"
        >
          <X size={24} strokeWidth={1} />
        </button>

        <p className="font-mono text-xs tracking-widest text-[#5E676C] uppercase mb-8">
          OPERATOR PROFILE
        </p>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#F1F3F4] uppercase tracking-tight mb-2">
          {opName}
        </h2>
        
        <div className="flex items-center gap-4 font-mono text-sm tracking-widest text-[#929A9E] uppercase mb-12">
          <span className="text-[#FFCC00] font-bold">{opId}</span>
          <span className="w-1 h-1 rounded-full bg-[#141819]" />
          <span>{skill} OPERATOR</span>
        </div>

        <div className="w-full h-px bg-[#141819] mb-8" />

        <p className="font-mono text-xs tracking-widest text-[#5E676C] uppercase mb-6">
          CURRENT MACHINE ASSIGNMENT
        </p>

        <h3 className="text-2xl font-bold text-[#F1F3F4] tracking-tight uppercase mb-2">
          {machineModel}
        </h3>
        <p className="font-mono text-sm tracking-widest text-[#929A9E] uppercase">
          UNIT {machineId}
        </p>

      </div>
    </div>
  );
}
