'use client';

import type { PlanetData, NightWindow } from '@/lib/types';
import { ObjectCard, formatTime } from './ObjectCard';
import { directionLabel, altitudePhrase } from '@/lib/format';
import { PanelHeader, SkeletonCard, EmptyState } from './PanelChrome';

type PlanetsPanelProps = {
  planets: PlanetData[];
  night: NightWindow | null;
};

export function PlanetsPanel({ planets }: PlanetsPanelProps) {
  const sorted = [...planets].sort((a, b) => {
    if (a.visibleHours === 0 && b.visibleHours > 0) return 1;
    if (b.visibleHours === 0 && a.visibleHours > 0) return -1;
    return b.viewingScore - a.viewingScore;
  });
  const topScore = sorted[0]?.viewingScore ?? 0;
  const visibleCount = planets.filter((p) => p.isVisible && p.visibleHours > 0).length;

  return (
    <section className="flex flex-col gap-4">
      <PanelHeader emoji="🪐" title="Planets" count={planets.length ? visibleCount : undefined} accent="text-sky-300" />

      {planets.length === 0 ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((planet) => (
            <ObjectCard
              key={planet.name}
              title={planet.name}
              subtitle={`Magnitude ${planet.magnitude >= 0 ? '+' : ''}${planet.magnitude.toFixed(1)}`}
              score={planet.viewingScore}
              type="planet"
              dimmed={!planet.isVisible || planet.visibleHours === 0}
              isTopPick={planet.viewingScore === topScore && planet.viewingScore > 0}
              look={
                planet.isVisible && planet.visibleHours > 0
                  ? { direction: directionLabel(planet.azimuth), altitude: altitudePhrase(planet.transitAltitude) }
                  : undefined
              }
              details={[
                { label: 'Peak Alt.', value: planet.transitAltitude.toFixed(0) + '°' },
                { label: 'Rise', value: formatTime(planet.riseTime) },
                { label: 'Set', value: formatTime(planet.setTime) },
                { label: 'Transit', value: formatTime(planet.transitTime) },
                {
                  label: 'Visible',
                  value: planet.visibleHours > 0 ? planet.visibleHours.toFixed(1) + 'h' : 'Daytime',
                },
              ]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
