import React, { useState } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  const [currentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[810px] bg-slate-950 rounded-[48px] p-3 shadow-2xl ring-1 ring-slate-800 border-[6px] border-slate-800/80 flex flex-col select-none overflow-hidden">
      {/* Top Notch / Dynamic Island & Status Bar */}
      <div className="absolute top-0 inset-x-0 h-10 px-7 pt-3 flex items-center justify-between z-40 pointer-events-none text-slate-200">
        <span className="text-[12px] font-bold font-mono tracking-tight">{currentTime}</span>

        {/* Dynamic Island Pill */}
        <div className="w-24 h-4 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60" />
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>

      {/* Mobile Screen Body */}
      <div className="w-full h-full rounded-[38px] overflow-hidden bg-slate-950 flex flex-col pt-8 relative">
        {children}

        {/* iOS / Android Home Indicator Bar */}
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none z-50">
          <div className="w-32 h-1 bg-slate-500/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};
