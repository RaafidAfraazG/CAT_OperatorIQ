import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';

interface DomainPlaceholderProps {
  title: string;
  icon: React.ElementType;
  legacyRoute: string;
  features: string[];
}

export default function DomainPlaceholder({
  title,
  icon: Icon,
  legacyRoute,
  features,
}: DomainPlaceholderProps) {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-12 bg-[#080A0B] select-none text-center">
      <div className="flex flex-col items-center max-w-2xl animate-fade-in">
        
        <div className="mb-8 text-[#5E676C]">
          <Icon size={48} strokeWidth={1} />
        </div>

        <p className="font-mono text-xs tracking-widest text-[#FFCC00] uppercase mb-4">
          PHASE 2 HMI TRANSFORMATION
        </p>

        <h2 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#F1F3F4] mb-4">
          {title} DOMAIN
        </h2>
        
        <p className="text-lg text-[#929A9E] mb-12 max-w-lg">
          This domain is scheduled for a Phase 3 visual redesign to match the new OEM instrument cluster aesthetic.
        </p>

        <div className="w-full h-px bg-[#141819] mb-12" />

        <div className="text-left w-full max-w-sm mb-12">
          <p className="font-mono text-xs tracking-widest text-[#5E676C] uppercase mb-6 text-center">
            MAPPED CAPABILITIES
          </p>
          <ul className="space-y-4">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-4 font-mono text-sm tracking-widest text-[#F1F3F4] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141819]" />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        <NavLink
          to={legacyRoute}
          className="group flex flex-col items-center gap-2 cursor-pointer outline-none"
        >
          <div className="flex items-center gap-3 font-mono text-sm font-bold tracking-widest text-[#F1F3F4] uppercase hover:text-[#FFCC00] transition-colors">
            <ArrowLeftRight size={16} />
            <span>ACCESS LEGACY {title}</span>
          </div>
          <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase group-hover:text-[#929A9E] transition-colors">
            TEMPORARY AUDIT REFERENCE
          </span>
        </NavLink>

      </div>
    </div>
  );
}
