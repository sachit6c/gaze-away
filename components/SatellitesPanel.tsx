'use client';

import type { SatellitePass } from '@/lib/types';
import { ObjectCard, formatTime } from './ObjectCard';
import { azimuthToCompass, directionLabel, formatDuration } from '@/lib/format';
import { PanelHeader, SkeletonCard, EmptyState } from './PanelChrome';

type SatellitesPanelProps = {
  passes: SatellitePass[];
  loading: boolean;
};

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function SatellitesPanel({ passes, loading }: SatellitesPanelProps) {
  const sorted = [...passes].sort((a, b) => b.viewingScore - a.viewingScore).slice(0, 10);
  const topScore = sorted[0]?.viewingScore ?? 0;

  return (
    <section className="flex flex-col gap-4">
      <PanelHeader
        emoji="🛰️"
        title="Satellite Passes"
        count={!loading && passes.length ? sorted.length : undefined}
        accent="text-cyan-300"
      />

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState emoji="🛰️" message="No bright satellite passes during tonight's dark hours." />
      ) : (
        <div className="space-y-3">
          {sorted.map((pass) => {
            const dayLabel = isToday(pass.startTime)
              ? 'Tonight'
              : pass.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <ObjectCard
                key={`${pass.noradId}-${pass.startTime.toISOString()}`}
                title={pass.satelliteName}
                subtitle={`${dayLabel} · travels ${azimuthToCompass(pass.startAzimuth)} → ${azimuthToCompass(pass.endAzimuth)}`}
                score={pass.viewingScore}
                type="satellite"
                isTopPick={pass.viewingScore === topScore && pass.viewingScore > 0}
                look={{ direction: directionLabel(pass.maxAzimuth), altitude: `peaks at ${pass.maxAltitude.toFixed(0)}°` }}
                details={[
                  { label: 'Starts', value: formatTime(pass.startTime) },
                  { label: 'Peak', value: formatTime(pass.maxTime) },
                  { label: 'Ends', value: formatTime(pass.endTime) },
                  { label: 'Max Alt.', value: pass.maxAltitude.toFixed(0) + '°' },
                  { label: 'Duration', value: formatDuration(pass.duration) },
                ]}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
