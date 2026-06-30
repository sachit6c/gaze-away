'use client';

import type { SatellitePass } from '@/lib/types';
import { ObjectCard, formatTime } from './ObjectCard';

type SatellitesPanelProps = {
  passes: SatellitePass[];
  loading: boolean;
};

function SkeletonCard() {
  return (
    <div className="bg-[#0d1726]/80 border border-[#2a4a6e]/30 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-700/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700/60 rounded w-2/3" />
          <div className="h-3 bg-gray-700/40 rounded w-1/2" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-700/60" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-2 bg-gray-700/40 rounded w-1/2" />
            <div className="h-3 bg-gray-700/60 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SatellitesPanel({ passes, loading }: SatellitesPanelProps) {
  const sorted = [...passes]
    .sort((a, b) => b.viewingScore - a.viewingScore)
    .slice(0, 10);

  const topScore = sorted[0]?.viewingScore ?? 0;

  return (
    <section className="space-y-4">
      <h2 className="text-white text-xl font-bold tracking-tight">Satellite Passes 🛰️</h2>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">
          No visible passes in the next 24 hours.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((pass) => (
            <ObjectCard
              key={`${pass.noradId}-${pass.startTime.toISOString()}`}
              title={pass.satelliteName}
              subtitle={'Pass on ' + pass.startTime.toLocaleDateString()}
              score={pass.viewingScore}
              type="satellite"
              isTopPick={pass.viewingScore === topScore && pass.viewingScore > 0}
              details={[
                { label: 'Start', value: formatTime(pass.startTime) },
                { label: 'End', value: formatTime(pass.endTime) },
                { label: 'Max Altitude', value: pass.maxAltitude.toFixed(1) + '°' },
                { label: 'Duration', value: pass.duration.toFixed(1) + ' min' },
              ]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
