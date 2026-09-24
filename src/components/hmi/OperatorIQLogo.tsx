import React from 'react';
import horizontalLogo from '../../assets/images/operatoriq-horizontal-logo.png';

export default function OperatorIQLogo() {
  return (
    <div className="flex items-center select-none group py-0.5">
      <img
        src={horizontalLogo}
        alt="CAT OperatorIQ"
        className="h-[32px] w-auto object-contain transition-transform group-hover:scale-[1.02] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
