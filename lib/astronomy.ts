'use client';

import * as Astronomy from 'astronomy-engine';
import type { ObserverLocation, NightWindow, PlanetData, ConstellationData, ConstellationJSON } from './types';
import constellationsData from '../data/constellations.json';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSunAltitude(obs: Astronomy.Observer, d: Date): number {
  const t = Astronomy.MakeTime(d);
  const eq = Astronomy.Equator(Astronomy.Body.Sun, t, obs, true, true);
  const hor = Astronomy.Horizon(t, obs, eq.ra, eq.dec, 'normal');
  return hor.altitude;
}

/**
 * Walk forward in 2-minute steps from startDate and return the first moment the
 * sun altitude crosses targetAlt in the given direction.
 *
 * direction: +1 → rising through targetAlt, -1 → setting through targetAlt
 */
function findSunAtAltitude(
  obs: Astronomy.Observer,
  startDate: Date,
  targetAlt: number,
  direction: 1 | -1,
  searchHours = 12,
): Date | null {
  const stepMs = 2 * 60 * 1000; // 2 minutes
  const steps = Math.ceil((searchHours * 60 * 60 * 1000) / stepMs);

  let prevAlt = makeSunAltitude(obs, startDate);
  let prevTime = startDate.getTime();

  for (let i = 1; i <= steps; i++) {
    const now = new Date(startDate.getTime() + i * stepMs);
    const alt = makeSunAltitude(obs, now);

    const crossed =
      direction === 1
        ? prevAlt <= targetAlt && alt > targetAlt
        : prevAlt >= targetAlt && alt < targetAlt;

    if (crossed) {
      // linear interpolation for a finer estimate
      const frac = (targetAlt - prevAlt) / (alt - prevAlt);
      return new Date(prevTime + frac * stepMs);
    }

    prevAlt = alt;
    prevTime = now.getTime();
  }

  return null;
}

// ── getNightWindow ────────────────────────────────────────────────────────────

export function getNightWindow(location: ObserverLocation, date: Date): NightWindow {
  const obs = new Astronomy.Observer(location.lat, location.lon, 0);

  // Anchor the search at the observer's LOCAL noon on the selected day, then walk
  // forward through the evening. Starting at noon (not UTC noon) guarantees we
  // are before sunset regardless of the observer's timezone.
  const localNoon = new Date(date);
  localNoon.setHours(12, 0, 0, 0);

  // Look for the sun setting below astronomical twilight (-18°). At high summer
  // latitudes the sun may never get that low, so fall back through nautical,
  // civil, and finally geometric sunset so we always produce a usable window.
  const thresholds = [-18, -12, -6, -0.833];
  let eveningTwilight: Date | null = null;
  let usedThreshold = -18;
  for (const t of thresholds) {
    const ev = findSunAtAltitude(obs, localNoon, t, -1, 16);
    if (ev) {
      eveningTwilight = ev;
      usedThreshold = t;
      break;
    }
  }

  // Fallbacks for the (rare) polar-day case where the sun never sets.
  if (!eveningTwilight) {
    const fallbackEvening = new Date(localNoon.getTime() + 9 * 3600_000); // ~21:00 local
    const fallbackMorning = new Date(localNoon.getTime() + 18 * 3600_000); // ~06:00 local next day
    return { eveningTwilight: fallbackEvening, morningTwilight: fallbackMorning, darkHours: 0 };
  }

  // Morning twilight: the matching upward crossing, searched forward FROM dusk so
  // it is always after the evening time.
  const morningTwilight =
    findSunAtAltitude(obs, eveningTwilight, usedThreshold, 1, 16) ??
    new Date(eveningTwilight.getTime() + 8 * 3600_000);

  const darkHours = Math.max(0, (morningTwilight.getTime() - eveningTwilight.getTime()) / 3_600_000);

  return { eveningTwilight, morningTwilight, darkHours };
}

// ── getPlanetsForNight ────────────────────────────────────────────────────────

const PLANET_LIST: Array<{ name: string; body: Astronomy.Body }> = [
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus',   body: Astronomy.Body.Venus   },
  { name: 'Mars',    body: Astronomy.Body.Mars    },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn',  body: Astronomy.Body.Saturn  },
  { name: 'Uranus',  body: Astronomy.Body.Uranus  },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
];

function getConstellationForRA(ra: number): string {
  // Very rough mapping by RA (hours) and Dec — good enough for UI labels
  const raHours = ra; // already in hours when coming from Equator()
  if (raHours >= 5 && raHours < 8)  return 'Gemini/Orion region';
  if (raHours >= 8 && raHours < 11) return 'Leo region';
  if (raHours >= 11 && raHours < 14) return 'Virgo region';
  if (raHours >= 14 && raHours < 17) return 'Boötes/Hercules region';
  if (raHours >= 17 && raHours < 20) return 'Sagittarius region';
  if (raHours >= 20 && raHours < 23) return 'Aquarius/Pegasus region';
  return 'Aries/Pisces region';
}

export function getPlanetsForNight(location: ObserverLocation, date: Date): PlanetData[] {
  const { eveningTwilight, morningTwilight, darkHours } = getNightWindow(location, date);
  const obs = new Astronomy.Observer(location.lat, location.lon, 0);

  const results: PlanetData[] = [];

  for (const { name, body } of PLANET_LIST) {
    try {
      const tEvening = Astronomy.MakeTime(eveningTwilight);

      // Current position at evening twilight
      const eqNow = Astronomy.Equator(body, tEvening, obs, true, true);
      const horNow = Astronomy.Horizon(tEvening, obs, eqNow.ra, eqNow.dec, 'normal');

      // Magnitude
      const illum = Astronomy.Illumination(body, tEvening);
      const magnitude = illum.mag;

      // Transit (meridian crossing) starting from evening twilight
      let transitTime: Date | null = null;
      let transitAltitude = 0;
      try {
        const transit = Astronomy.SearchHourAngle(body, obs, 0.0, tEvening, +1);
        if (transit) {
          transitTime = transit.time.date;
          const eqT = Astronomy.Equator(body, transit.time, obs, true, true);
          const horT = Astronomy.Horizon(transit.time, obs, eqT.ra, eqT.dec, 'normal');
          transitAltitude = horT.altitude;
        }
      } catch {
        // transit search failed — use current altitude as fallback
        transitAltitude = horNow.altitude;
      }

      // Rise/set times — search starting from evening twilight
      let riseTime: Date | null = null;
      let setTime: Date | null = null;
      try {
        const riseResult = Astronomy.SearchRiseSet(body, obs, +1, tEvening, 1);
        riseTime = riseResult?.date ?? null;
      } catch { /* ignore */ }
      try {
        const setResult = Astronomy.SearchRiseSet(body, obs, -1, tEvening, 1);
        setTime = setResult?.date ?? null;
      } catch { /* ignore */ }

      // Visible hours: overlap of (rise..set) with (eveningTwilight..morningTwilight)
      let visibleHours = 0;
      const darkStart = eveningTwilight.getTime();
      const darkEnd   = morningTwilight.getTime();

      if (riseTime && setTime) {
        const overlapStart = Math.max(riseTime.getTime(), darkStart);
        const overlapEnd   = Math.min(setTime.getTime(), darkEnd);
        visibleHours = Math.max(0, (overlapEnd - overlapStart) / 3_600_000);
      } else if (!riseTime && !setTime) {
        // Circumpolar or never rises — check if above horizon during night
        if (transitAltitude > 0) {
          visibleHours = darkHours;
        }
      } else if (!riseTime && setTime) {
        // Already up at start of night
        const overlapEnd = Math.min(setTime.getTime(), darkEnd);
        visibleHours = Math.max(0, (overlapEnd - darkStart) / 3_600_000);
      } else if (riseTime && !setTime) {
        // Rises but never sets during search window
        const overlapStart = Math.max(riseTime.getTime(), darkStart);
        visibleHours = Math.max(0, (darkEnd - overlapStart) / 3_600_000);
      }

      const isVisible = transitAltitude > 15;

      results.push({
        name,
        body: name,
        altitude:        horNow.altitude,
        azimuth:         horNow.azimuth,
        riseTime,
        setTime,
        transitTime,
        transitAltitude,
        magnitude,
        constellation:   getConstellationForRA(eqNow.ra),
        viewingScore:    0,
        isVisible,
        visibleHours,
      });
    } catch {
      // Skip this planet on any unhandled error
    }
  }

  return results;
}

// ── getConstellationsForNight ─────────────────────────────────────────────────

export function getConstellationsForNight(location: ObserverLocation, date: Date): ConstellationData[] {
  const { eveningTwilight, morningTwilight } = getNightWindow(location, date);
  const obs = new Astronomy.Observer(location.lat, location.lon, 0);

  const stepMs = 10 * 60 * 1000; // 10 minutes
  const nightDurationMs = morningTwilight.getTime() - eveningTwilight.getTime();
  const steps = Math.max(1, Math.ceil(nightDurationMs / stepMs));

  const constellations = constellationsData as ConstellationJSON[];
  const results: ConstellationData[] = [];

  for (const c of constellations) {
    try {
      // RA in JSON is in degrees → convert to hours for Horizon()
      const raHours = c.ra / 15;
      const decDeg  = c.dec;

      let peakAltitude = -90;
      let peakAzimuth = 0;
      let peakTime: Date | null = null;
      let riseTime: Date | null = null;
      let setTime: Date | null = null;
      let visibleMinutes = 0;
      let prevAlt: number | null = null;

      for (let i = 0; i <= steps; i++) {
        const stepDate = new Date(eveningTwilight.getTime() + i * stepMs);
        const t = Astronomy.MakeTime(stepDate);
        const hor = Astronomy.Horizon(t, obs, raHours, decDeg, 'normal');
        const alt = hor.altitude;

        // Accumulate visible time
        if (alt > 0) {
          visibleMinutes += 10;
        }

        // Track peak
        if (alt > peakAltitude) {
          peakAltitude = alt;
          peakAzimuth = hor.azimuth;
          peakTime = stepDate;
        }

        // Detect rise (crossing from ≤0 to >0)
        if (prevAlt !== null && prevAlt <= 0 && alt > 0 && riseTime === null) {
          // Interpolate
          const frac = (0 - prevAlt) / (alt - prevAlt);
          riseTime = new Date(stepDate.getTime() - stepMs + frac * stepMs);
        }

        // Detect set (crossing from >0 to ≤0)
        if (prevAlt !== null && prevAlt > 0 && alt <= 0) {
          const frac = (0 - prevAlt) / (alt - prevAlt);
          setTime = new Date(stepDate.getTime() - stepMs + frac * stepMs);
        }

        prevAlt = alt;
      }

      // If it was above horizon at start of night and never set, flag set as null
      // (already handled — setTime only set when crossing downward)

      const visibleHours = visibleMinutes / 60;
      const isVisible = peakAltitude > 15;

      results.push({
        name:         c.name,
        abbreviation: c.abbreviation,
        description:  c.description,
        ra:           c.ra,
        dec:          c.dec,
        bestSeason:   c.bestSeason,
        magnitude:    c.magnitude,
        riseTime,
        setTime,
        peakTime,
        peakAltitude,
        peakAzimuth,
        viewingScore: 0,
        isVisible,
        visibleHours,
      });
    } catch {
      // Skip this constellation on error
    }
  }

  return results;
}
