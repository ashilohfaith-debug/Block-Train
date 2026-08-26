'use client';

import React, { useState } from 'react';
import { DigitalTwinMap } from '../components/map/DigitalTwinMap';
import { DashboardHUD } from '../components/ui/DashboardHUD';
import { SpeedController } from '../components/ui/SpeedController';
import { useClock } from '../lib/hooks/useClock';
import { DEFAULT_SPEED_MULTIPLIER } from '../lib/constants';

export default function RailwayDigitalTwin() {
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED_MULTIPLIER);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const time = useClock();

  return (
    <div className={`w-full h-screen overflow-hidden relative font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-[#d6e1c9] text-slate-800'}`}>
      
      <DigitalTwinMap speedMultiplier={speedMultiplier} />
      <DashboardHUD time={time} />
      <SpeedController speed={speedMultiplier} setSpeed={setSpeedMultiplier} />
      
      {/* Dark Mode Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute bottom-6 right-6 z-50 bg-[#111827]/90 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700 px-4 py-2 rounded-full font-mono text-sm shadow-xl backdrop-blur-md transition-all flex items-center gap-2"
      >
        {isDarkMode ? (
          <>☀️ Light Mode</>
        ) : (
          <>🌙 Dark Mode</>
        )}
      </button>

    </div>
  );
}
