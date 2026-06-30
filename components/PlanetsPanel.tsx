'use client';

import type { PlanetData, NightWindow } from '@/lib/types';
import { ObjectCard, formatTime } from './ObjectCard';

type PlanetsPanelProps = {
  planets: PlanetData[];
  night: NightWindow | null;
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

export function PlanetsPanel({ planets, night }: PlanetsPanelProps) {
  const sorted = [...planets].sort((a, b) => b.viewingScore - a.viewingScore);
  const topScore = sorted[0]?.viewingScore ?? 0;

  return (
    <section className="space-y-4">
      <h2 className="text-white text-xl font-bold tracking-tight">Planets Tonight 🪐</h2>

      {planets.length === 0 ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((planet) => (
            <div
              key={planet.name}
              className={planet.isVisible ? undefined : 'opacity-50'}
            >
              <ObjectCard
                title={planet.name}
                subtitle={`Magnitude: ${planet.magnitude >= 0 ? '+' : ''}${planet.magnitude.toFixed(1)}`}
                score={planet.viewingScore}
                type="planet"
                isTopPick={planet.viewingScore === topScore && planet.viewingScore > 0}
                details={[
                  { label: 'Peak Altitude', value: planet.transitAltitude.toFixed(1) + '°' },
                  { label: 'Rise', value: formatTime(planet.riseTime) },
                  { label: 'Set', value: formatTime(planet.setTime) },
                  { label: 'Transit', value: formatTime(planet.transitTime) },
                  { label: 'Visible', value: planet.visibleHours.toFixed(1) + 'h tonight' },
                ]}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
