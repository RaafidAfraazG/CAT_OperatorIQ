import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gauge, ClipboardList, Cpu, Shield, Brain } from 'lucide-react';

interface DomainItem {
  id: string;
  to: string;
  label: string;
  icon: React.ElementType;
}

const domains: DomainItem[] = [
  { id: 'drive',   to: '/',        label: 'DRIVE',   icon: Gauge        },
  { id: 'work',    to: '/work',    label: 'WORK',    icon: ClipboardList },
  { id: 'machine', to: '/machine', label: 'MACHINE', icon: Cpu          },
  { id: 'safety',  to: '/safety',  label: 'SAFETY',  icon: Shield       },
  { id: 'assist',  to: '/assist',  label: 'ASSIST',  icon: Brain        },
];

export default function HMINavigation() {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isDomainActive = (to: string) => {
    if (to === '/') return location.pathname === '/' || location.pathname === '/drive';
    if (to === '/work') return location.pathname === '/work' || location.pathname === '/tasks';
    if (to === '/assist') return ['/assist', '/insights', '/training', '/shift-report'].includes(location.pathname);
    return location.pathname.startsWith(to);
  };

  const activeIndex = domains.findIndex(d => isDomainActive(d.to));
  const activeIdx = activeIndex !== -1 ? activeIndex : 0; // fallback

  return (
    <nav
      className="h-[64px] lg:h-[72px] bg-[rgba(20,24,25,0.82)] backdrop-blur-[14px] saturate-[1.1] border-t border-[rgba(255,255,255,0.055)] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_-4px_20px_rgba(0,0,0,0.18)] flex justify-center shrink-0 select-none z-30"
      aria-label="In-Cab HMI Navigation"
    >
      <div 
        className="w-full h-full grid grid-cols-5 relative"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Sliding Hover Glass Overlay */}
        <div 
          className="absolute top-0 bottom-0 w-1/5 pointer-events-none transition-all ease-[cubic-bezier(0.22,1,0.36,1)] z-0"
          style={{
            transform: `translateX(${hoveredIndex !== null ? hoveredIndex * 100 : activeIdx * 100}%)`,
            opacity: hoveredIndex !== null ? 1 : 0,
            transitionDuration: '220ms',
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035), inset 0 -1px 0 rgba(255,255,255,0.02)'
          }}
        />

        {domains.map(({ id, to, label, icon: Icon }, i) => {
          const active = i === activeIdx;
          
          // Soften separator if adjacent to hovered or active zone
          const isSoftBorder = 
            (hoveredIndex !== null && (hoveredIndex === i || hoveredIndex === i - 1)) ||
            (activeIdx === i || activeIdx === i - 1);
          
          const borderClass = i > 0 
            ? `border-l transition-colors duration-220 ${isSoftBorder ? 'border-[rgba(255,255,255,0.02)]' : 'border-[rgba(255,255,255,0.07)]'}` 
            : '';

          return (
            <div
              key={id}
              className={`relative flex items-center justify-center h-full ${borderClass} z-10`}
              onMouseEnter={() => setHoveredIndex(i)}
            >
              <NavLink
                to={to}
                className="relative flex items-center justify-center gap-3 w-full h-full touch-manipulation group outline-none"
                style={{
                  background: active ? 'rgba(255,255,255,0.055)' : 'transparent',
                  transition: 'background 220ms ease, color 180ms ease'
                }}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active Indicator Line */}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FFCC00]" />
                )}

                <Icon
                  size={20}
                  className={`transition-colors duration-[180ms] ${
                    active ? 'text-[#FFCC00]' : 'text-[#929A9E]'
                  }`}
                />

                <span
                  className={`font-mono text-[13px] font-extrabold tracking-widest uppercase mt-0.5 transition-colors duration-[180ms] ${
                    active ? 'text-[#F1F3F4]' : 'text-[#929A9E]'
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
