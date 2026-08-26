'use client';

import React, { useState } from 'react';
import { DigitalTwinMap } from '../components/map/DigitalTwinMap';
import { DashboardHUD } from '../components/ui/DashboardHUD';
import { SpeedController } from '../components/ui/SpeedController';
import { useClock } from '../lib/hooks/useClock';
import { DEFAULT_SPEED_MULTIPLIER } from '../lib/constants';

export default function RailwayDigitalTwin() {
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED_MULTIPLIER);
  const time = useClock();

  return (
    <div className="w-full h-screen bg-[#d6e1c9] overflow-hidden relative font-sans text-slate-800">
      
      <DigitalTwinMap speedMultiplier={speedMultiplier} />
      <DashboardHUD time={time} />
      <SpeedController speed={speedMultiplier} setSpeed={setSpeedMultiplier} />
      
    </div>
  );
}
