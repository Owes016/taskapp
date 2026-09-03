import React from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone } from 'lucide-react';

interface MobileFrameWrapperProps {
  isMobilePreview: boolean;
  onTogglePreview: () => void;
  children: React.ReactNode;
}

export const MobileFrameWrapper: React.FC<MobileFrameWrapperProps> = ({
  isMobilePreview,
  onTogglePreview,
  children
}) => {
  if (!isMobilePreview) {
    return <div className="w-full">{children}</div>;
  }

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2">
      {/* Frame Switcher Bar */}
      <div className="mb-4 flex items-center justify-between w-full max-w-[420px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <span className="text-slate-300 font-medium flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          Android Native Shell Simulator (Pixel 8)
        </span>
        <button
          id="exit-mobile-frame-btn"
          onClick={onTogglePreview}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Exit Frame
        </button>
      </div>

      {/* Android Device Bezel */}
      <div className="relative w-full max-w-[420px] rounded-[44px] bg-slate-950 p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
        {/* Device Screen */}
        <div className="relative w-full rounded-[36px] bg-slate-950 overflow-hidden border border-slate-800 flex flex-col min-h-[780px] max-h-[850px]">
          {/* Android Status Bar */}
          <div className="h-9 bg-slate-950 px-6 flex items-center justify-between text-[11px] text-slate-300 select-none z-30 border-b border-slate-900">
            <span className="font-semibold">{currentTime}</span>
            {/* Center camera notch */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner"></div>
            <div className="flex items-center gap-2">
              <Signal className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-[10px]">5G</span>
              <Wifi className="w-3 h-3 text-slate-400" />
              <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 bg-slate-950">
            {children}
          </div>

          {/* Android Bottom Navigation Pill */}
          <div className="h-6 bg-slate-950 flex items-center justify-center z-30">
            <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
