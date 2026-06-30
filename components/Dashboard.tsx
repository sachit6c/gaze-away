'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ObserverLocation,
  PlanetData,
  ConstellationData,
  SatellitePass,
  NightWindow,
  TLEData,
} from '@/lib/types';
import {
  getPlanetsForNight,
  getConstellationsForNight,
  getNightWindow,
} from '@/lib/astronomy';
import { getSatellitePassesForNight } from '@/lib/satellites';
import {
  applyScores,
  scorePlanet,
  scoreConstellation,
  scoreSatellitePass,
  getScoreLabel,
  getScoreColor,
} from '@/lib/scoring';
import { PlanetsPanel } from './PlanetsPanel';
import { ConstellationsPanel } from './ConstellationsPanel';
import { SatellitesPanel } from './SatellitesPanel';
import { DateSelector } from './DateSelector';

interface DashboardProps {
  location: ObserverLocation;
  onChangeLocation?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function TopPickCard({
  emoji,
  name,
  score,
  label,
}: {
  emoji: string;
  name: string;
  score: number;
  label: string;
}) {
  const colorClass = getScoreColor(score);
  return (
    <div className="flex-shrink-0 w-48 bg-[#0d1726]/80 border border-[#2a4a6e]/50 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-white font-semibold text-sm leading-tight truncate">{name}</p>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${colorClass}`}>{score}</span>
        <span className={`text-xs ${colorClass}`}>{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function Dashboard({ location, onChangeLocation }: DashboardProps) {
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [planets, setPlanets] = useState<PlanetData[]>([]);
  const [constellations, setConstellations] = useState<ConstellationData[]>([]);
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [night, setNight] = useState<NightWindow | null>(null);
  const [loadingSatellites, setLoadingSatellites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const compute = useCallback(async () => {
    setError(null);

    // 1. Compute night window
    const nightWindow = getNightWindow(location, date);
    setNight(nightWindow);

    // 2. Compute planets and apply scores
    const rawPlanets = getPlanetsForNight(location, date);
    const scoredPlanets = applyScores(rawPlanets, (p) => scorePlanet(p, nightWindow));
    setPlanets(scoredPlanets);

    // 3. Compute constellations and apply scores
    const rawConstellations = getConstellationsForNight(location, date);
    const scoredConstellations = applyScores(rawConstellations, (c) =>
      scoreConstellation(c, nightWindow)
    );
    setConstellations(scoredConstellations);

    // 4. Fetch TLE data and compute satellite passes
    setLoadingSatellites(true);
    try {
      const tleRes = await fetch('/api/tles');
      if (!tleRes.ok) {
        throw new Error(`TLE fetch failed: ${tleRes.status}`);
      }
      const tles = (await tleRes.json()) as TLEData[];
      const rawPasses = getSatellitePassesForNight(location, date, tles, {
        start: nightWindow.eveningTwilight,
        end: nightWindow.morningTwilight,
      });
      const scoredPasses = applyScores(rawPasses, (p) => scoreSatellitePass(p));
      setPasses(scoredPasses);
    } catch (err) {
      console.error('Satellite pass error:', err);
      setError('Could not load satellite data. Other data is still shown.');
      setPasses([]);
    } finally {
      setLoadingSatellites(false);
    }

    setLastUpdated(new Date());
  }, [location, date]);

  useEffect(() => {
    compute();
  }, [compute]);

  // Derive top picks
  const bestPlanet = planets.filter((p) => p.isVisible && p.viewingScore > 0)[0] ?? null;
  const bestConstellation =
    constellations.filter((c) => c.isVisible && c.viewingScore > 0)[0] ?? null;
  const bestPass = passes[0] ?? null;

  const locationName =
    location.name ??
    `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;

  return (
    <div className="min-h-screen bg-[#080f1a] text-white flex flex-col">
      {/* Header bar */}
      <header className="sticky top-0 z-20 bg-[#080f1a]/90 backdrop-blur border-b border-[#2a4a6e]/40 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔭</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Gaze Away</h1>
            {onChangeLocation ? (
              <button
                onClick={onChangeLocation}
                className="text-[#8ab4d4] text-xs truncate max-w-[220px] sm:max-w-xs hover:text-white transition-colors flex items-center gap-1 group"
              >
                <span className="truncate">{locationName}</span>
                <svg className="w-3 h-3 flex-shrink-0 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            ) : (
              <p className="text-[#8ab4d4] text-xs truncate max-w-[220px] sm:max-w-xs">{locationName}</p>
            )}
          </div>
        </div>
        <DateSelector date={date} onChange={setDate} />
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tonight's Top Picks */}
        {(bestPlanet || bestConstellation || bestPass) && (
          <section>
            <h2 className="text-white text-lg font-bold tracking-tight mb-3">
              {isToday(date)
                ? "Tonight’s Top Picks"
                : `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}’s Top Picks`}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {bestPlanet && (
                <TopPickCard
                  emoji="🪐"
                  name={bestPlanet.name}
                  score={bestPlanet.viewingScore}
                  label="Best Planet"
                />
              )}
              {bestConstellation && (
                <TopPickCard
                  emoji="✨"
                  name={bestConstellation.name}
                  score={bestConstellation.viewingScore}
                  label="Best Constellation"
                />
              )}
              {bestPass && (
                <TopPickCard
                  emoji="🛰️"
                  name={bestPass.satelliteName}
                  score={bestPass.viewingScore}
                  label="Next Satellite"
                />
              )}
            </div>
          </section>
        )}

        {/* Three-column panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PlanetsPanel planets={planets} night={night} />
          <ConstellationsPanel constellations={constellations} night={night} />
          <SatellitesPanel passes={passes} loading={loadingSatellites} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a4a6e]/30 px-4 sm:px-6 py-4 text-center text-xs text-gray-500">
        Data: astronomy-engine, CelesTrak&nbsp;&nbsp;|&nbsp;&nbsp;Last updated:{' '}
        {lastUpdated ? formatTime(lastUpdated) : '—'}
      </footer>
    </div>
  );
}
