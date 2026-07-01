'use client';

import type { ConstellationData, NightWindow } from '@/lib/types';
import { ObjectCard, formatTime } from './ObjectCard';
import { directionLabel, altitudePhrase } from '@/lib/format';
import { PanelHeader, EmptyState } from './PanelChrome';

type ConstellationsPanelProps = {
  constellations: ConstellationData[];
  night: NightWindow | null;
};

export function ConstellationsPanel({ constellations }: ConstellationsPanelProps) {
  const visible = constellations
    .filter((c) => c.isVisible)
    .sort((a, b) => b.viewingScore - a.viewingScore)
    .slice(0, 8);

  const topScore = visible[0]?.viewingScore ?? 0;

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max).trimEnd() + '…' : str;

  return (
    <section className="flex flex-col gap-4">
      <PanelHeader
        emoji="✨"
        title="Constellations"
        count={constellations.length ? visible.length : undefined}
        accent="text-violet-300"
      />

      {constellations.length === 0 ? (
        <EmptyState emoji="✨" message="Calculating tonight's sky…" />
      ) : visible.length === 0 ? (
        <EmptyState emoji="🌫️" message="No constellations rise high enough from this location tonight." />
      ) : (
        <div className="space-y-3">
          {visible.map((constellation) => (
            <ObjectCard
              key={constellation.abbreviation}
              title={`${constellation.name} (${constellation.abbreviation})`}
              description={truncate(constellation.description, 90)}
              score={constellation.viewingScore}
              type="constellation"
              isTopPick={constellation.viewingScore === topScore && constellation.viewingScore > 0}
              look={{
                direction: directionLabel(constellation.peakAzimuth),
                altitude: altitudePhrase(constellation.peakAltitude),
              }}
              details={[
                { label: 'Peak Alt.', value: constellation.peakAltitude.toFixed(0) + '°' },
                { label: 'Best Time', value: formatTime(constellation.peakTime) },
                { label: 'Visible', value: constellation.visibleHours.toFixed(1) + 'h' },
                { label: 'Season', value: constellation.bestSeason },
              ]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
