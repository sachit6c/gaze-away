'use client';

import * as satellite from 'satellite.js';
import type { ObserverLocation, SatellitePass, TLEData } from './types';

const MIN_ELEVATION = 10; // degrees
const STEP_SECONDS = 60;
const MAX_PASSES_PER_SATELLITE = 5;

/**
 * Given a date, return a night window from approximately 9 PM that evening
 * to 5 AM the following morning (local times expressed as UTC Date objects).
 * These are coarse defaults used when no twilight data is provided.
 */
function getDefaultNightWindow(date: Date): { start: Date; end: Date } {
  // Use the date's UTC day as a proxy for "that evening"
  const start = new Date(date);
  start.setUTCHours(21, 0, 0, 0);

  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(5, 0, 0, 0);

  return { start, end };
}

/**
 * Find visible satellite passes for all provided TLEs over a single night.
 *
 * @param location  Observer's geographic coordinates
 * @param date      The date of the night to predict passes for
 * @param tles      Array of TLE data objects to evaluate
 * @returns         All visible passes sorted by start time
 */
export function getSatellitePassesForNight(
  location: ObserverLocation,
  date: Date,
  tles: TLEData[]
): SatellitePass[] {
  const { start: windowStart, end: windowEnd } = getDefaultNightWindow(date);

  const observerGd = {
    longitude: satellite.degreesToRadians(location.lon),
    latitude: satellite.degreesToRadians(location.lat),
    height: 0.001, // km above sea level
  };

  const allPasses: SatellitePass[] = [];

  for (const tle of tles) {
    try {
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

      let inPass = false;
      let passCount = 0;

      // Accumulated state for the current pass
      let startTime: Date | null = null;
      let startAzimuth = 0;
      let maxAltitude = -Infinity;
      let maxTime: Date | null = null;
      let maxAzimuthAtPeak = 0;

      const currentTime = new Date(windowStart.getTime());

      while (currentTime <= windowEnd && passCount < MAX_PASSES_PER_SATELLITE) {
        const jsDate = new Date(currentTime.getTime());

        const posVel = satellite.propagate(satrec, jsDate);

        // Skip if satellite has decayed or propagation failed
        if (
          !posVel ||
          !posVel.position ||
          typeof posVel.position === 'boolean'
        ) {
          currentTime.setTime(currentTime.getTime() + STEP_SECONDS * 1000);
          continue;
        }

        const gmst = satellite.gstime(jsDate);
        const posEcf = satellite.eciToEcf(posVel.position as satellite.EciVec3<number>, gmst);
        const lookAngles = satellite.ecfToLookAngles(observerGd, posEcf);

        const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation);
        const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth);

        if (!inPass && elevationDeg >= MIN_ELEVATION) {
          // Satellite is rising above the horizon — start a new pass
          inPass = true;
          startTime = new Date(jsDate);
          startAzimuth = azimuthDeg;
          maxAltitude = elevationDeg;
          maxTime = new Date(jsDate);
          maxAzimuthAtPeak = azimuthDeg;
        } else if (inPass) {
          if (elevationDeg >= MIN_ELEVATION) {
            // Still in pass — track peak
            if (elevationDeg > maxAltitude) {
              maxAltitude = elevationDeg;
              maxTime = new Date(jsDate);
              maxAzimuthAtPeak = azimuthDeg;
            }
          } else {
            // Satellite has set — close the pass
            if (startTime && maxTime && maxAltitude >= MIN_ELEVATION) {
              const endTime = new Date(jsDate);
              const duration = Math.round(
                (endTime.getTime() - startTime.getTime()) / 1000
              );

              allPasses.push({
                satelliteName: tle.name,
                noradId: tle.noradId,
                startTime,
                endTime,
                maxTime,
                maxAltitude,
                startAzimuth,
                maxAzimuth: maxAzimuthAtPeak,
                endAzimuth: azimuthDeg,
                duration,
                viewingScore: 0,
              });

              passCount++;
            }

            // Reset pass state
            inPass = false;
            startTime = null;
            maxAltitude = -Infinity;
            maxTime = null;
          }
        }

        currentTime.setTime(currentTime.getTime() + STEP_SECONDS * 1000);
      }

      // Close any pass still active when the window ends
      if (
        inPass &&
        startTime &&
        maxTime &&
        maxAltitude >= MIN_ELEVATION &&
        passCount < MAX_PASSES_PER_SATELLITE
      ) {
        const endTime = new Date(windowEnd);
        const duration = Math.round(
          (endTime.getTime() - startTime.getTime()) / 1000
        );

        allPasses.push({
          satelliteName: tle.name,
          noradId: tle.noradId,
          startTime,
          endTime,
          maxTime,
          maxAltitude,
          startAzimuth,
          maxAzimuth: maxAzimuthAtPeak,
          endAzimuth: 0,
          duration,
          viewingScore: 0,
        });
      }
    } catch (err) {
      console.error(
        `Error predicting passes for satellite ${tle.name} (${tle.noradId}):`,
        err
      );
    }
  }

  // Sort all collected passes by start time ascending
  allPasses.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return allPasses;
}
