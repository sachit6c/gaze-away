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
} from '@/lib/scoring';
import { formatTimeShort, formatDuration } from '@/lib/format';
import { PlanetsPanel } from './PlanetsPanel';
import { ConstellationsPanel } from './ConstellationsPanel';
import { SatellitesPanel } from './SatellitesPanel';
import { DateSelector } from './DateSelector';

interface DashboardProps {
  location: ObserverLocation;
  onChangeLocation?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function scoreToneClasses(score: number): { text: string; bar: string } {
  if (score >= 70) return { text: 'text-emerald-300', bar: 'from-emerald-400 to-emerald-300' };
  if (score >= 50) return { text: 'text-sky-300', bar: 'from-sky-400 to-sky-300' };
  if (score >= 30) return { text: 'text-amber-300', bar: 'from-amber-400 to-amber-300' };
  return { text: 'text-rose-300', bar: 'from-rose-400 to-rose-300' };
}

function TopPickCard({
  emoji,
  label,
  name,
  score,
  meta,
}: {
  emoji: string;
  label: string;
  name: string;
  score: number;
  meta?: string;
}) {
  const tone = scoreToneClasses(score);
  return (
    <div className="glass group relative flex-1 overflow-hidden rounded-2xl border border-white/10 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20">
      <div className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-10 transition-transform duration-500 group-hover:scale-110">
        {emoji}
      </div>
      <div className="relative">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <p className="mt-1 truncate text-lg font-bold text-white">{name}</p>
        {meta && <p className="mt-0.5 truncate text-xs text-slate-400">{meta}</p>}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
              style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${tone.text}`}>{score}</span>
          <span className={`text-[11px] font-medium ${tone.text}`}>{getScoreLabel(score)}</span>
        </div>
      </div>
    </div>
  );
}

function DarknessBanner({ night, date }: { night: NightWindow | null; date: Date }) {
  if (!night) return null;
  const dark = night.darkHours;
  return (
    <div className="glass flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/10 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">🌙</span>
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {isToday(date) ? 'Tonight’s dark window' : 'Dark window'}
          </p>
          <p className="text-sm font-semibold text-white">
            {dark > 0 ? `${formatTimeShort(night.eveningTwilight)} – ${formatTimeShort(night.morningTwilight)}` : 'No true darkness'}
          </p>
        </div>
      </div>
      <div className="hidden h-8 w-px bg-white/10 sm:block" />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Dark hours</p>
        <p className="text-sm font-semibold text-star-blue">
          {dark > 0 ? formatDuration(dark * 60) : '—'}
        </p>
      </div>
      <p className="ml-auto hidden max-w-xs text-xs text-slate-400 md:block">
        The sky is darkest between dusk and dawn twilight — the best time to observe faint objects.
      </p>
    </div>
  );
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

    const nightWindow = getNightWindow(location, date);
    setNight(nightWindow);

    const rawPlanets = getPlanetsForNight(location, date);
    const scoredPlanets = applyScores(rawPlanets, (p) => scorePlanet(p, nightWindow));
    setPlanets(scoredPlanets);

    const rawConstellations = getConstellationsForNight(location, date);
    const scoredConstellations = applyScores(rawConstellations, (c) =>
      scoreConstellation(c, nightWindow)
    );
    setConstellations(scoredConstellations);

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

  // Match the Planets panel ordering: a "best planet" must actually be up during
  // the dark window, not merely above the horizon in daytime.
  const bestPlanet =
    planets.filter((p) => p.isVisible && p.visibleHours > 0 && p.viewingScore > 0)[0] ?? null;
  const bestConstellation =
    constellations.filter((c) => c.isVisible && c.viewingScore > 0)[0] ?? null;
  const bestPass = passes[0] ?? null;
  const hasPicks = bestPlanet || bestConstellation || bestPass;

  const locationName = location.name ?? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;
  const dateLabel = isToday(date)
    ? 'Tonight'
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex min-h-screen flex-col text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500/30 to-violet-500/20 ring-1 ring-white/10">
              <svg className="h-5 w-5 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21l6-6" />
                <path d="M14.5 3.5 20.5 9.5" />
                <path d="M9.5 14.5 6 18l-1.5-1.5L8 13" />
                <rect x="12.5" y="1.8" width="4" height="11" rx="2" transform="rotate(45 14.5 7.3)" />
                <circle cx="18" cy="5" r="0.6" fill="currentColor" />
                <circle cx="21" cy="8" r="0.5" fill="currentColor" />
              </svg>
            </span>
            <div>
              <h1 className="text-glow text-lg font-bold leading-tight tracking-tight text-white">Gaze Away</h1>
              {onChangeLocation ? (
                <button
                  onClick={onChangeLocation}
                  className="group flex items-center gap-1 text-xs text-star-blue transition-colors hover:text-white"
                >
                  <svg className="h-3 w-3 flex-shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  <span className="max-w-[220px] truncate sm:max-w-xs">{locationName}</span>
                  <svg className="h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.5-6.5a2.5 2.5 0 013.536 3.536L12.5 14.5 9 15l.5-3.5z" /></svg>
                </button>
              ) : (
                <p className="max-w-[220px] truncate text-xs text-star-blue sm:max-w-xs">{locationName}</p>
              )}
            </div>
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-900/25 px-4 py-3 text-sm text-rose-200">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <DarknessBanner night={night} date={date} />

        {/* Top Picks */}
        {hasPicks && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              {dateLabel === 'Tonight' ? "Tonight’s top picks" : `${dateLabel} · top picks`}
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              {bestPlanet && (
                <TopPickCard
                  emoji="🪐"
                  label="Best Planet"
                  name={bestPlanet.name}
                  score={bestPlanet.viewingScore}
                  meta={`Mag ${bestPlanet.magnitude >= 0 ? '+' : ''}${bestPlanet.magnitude.toFixed(1)} · peaks ${bestPlanet.transitAltitude.toFixed(0)}°`}
                />
              )}
              {bestConstellation && (
                <TopPickCard
                  emoji="✨"
                  label="Best Constellation"
                  name={bestConstellation.name}
                  score={bestConstellation.viewingScore}
                  meta={`Peaks ${bestConstellation.peakAltitude.toFixed(0)}° · best in ${bestConstellation.bestSeason}`}
                />
              )}
              {bestPass && (
                <TopPickCard
                  emoji="🛰️"
                  label="Next Satellite"
                  name={bestPass.satelliteName}
                  score={bestPass.viewingScore}
                  meta={`${formatTimeShort(bestPass.startTime)} · max ${bestPass.maxAltitude.toFixed(0)}°`}
                />
              )}
            </div>
          </section>
        )}

        {/* Three-column panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PlanetsPanel planets={planets} night={night} />
          <ConstellationsPanel constellations={constellations} night={night} />
          <SatellitesPanel passes={passes} loading={loadingSatellites} />
        </div>
      </main>

      <footer className="border-t border-white/8 px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
        Data: astronomy-engine &amp; CelesTrak · Last updated {lastUpdated ? formatTime(lastUpdated) : '—'}
      </footer>
    </div>
  );
}
