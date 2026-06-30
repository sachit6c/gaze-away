'use client';

import type { ConstellationData, NightWindow } from '@/lib/types';
import { ObjectCard, formatTime } from './ObjectCard';

type ConstellationsPanelProps = {
  constellations: ConstellationData[];
  night: NightWindow | null;
};

export function ConstellationsPanel({ constellations, night }: ConstellationsPanelProps) {
  const visible = constellations
    .filter((c) => c.isVisible)
    .sort((a, b) => b.viewingScore - a.viewingScore)
    .slice(0, 8);

  const topScore = visible[0]?.viewingScore ?? 0;

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max).trimEnd() + '…' : str;

  return (
    <section className="space-y-4">
      <h2 className="text-white text-xl font-bold tracking-tight">Constellations Tonight ✨</h2>

      {visible.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">
          No constellations visible tonight from this location.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((constellation) => (
            <ObjectCard
              key={constellation.abbreviation}
              title={`${constellation.name} (${constellation.abbreviation})`}
              subtitle={truncate(constellation.description, 80)}
              score={constellation.viewingScore}
              type="constellation"
              isTopPick={constellation.viewingScore === topScore && constellation.viewingScore > 0}
              details={[
                { label: 'Peak Altitude', value: constellation.peakAltitude.toFixed(1) + '°' },
                { label: 'Best Viewing', value: formatTime(constellation.peakTime) },
                { label: 'Visible', value: constellation.visibleHours.toFixed(1) + 'h' },
                { label: 'Best Season', value: constellation.bestSeason },
              ]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
