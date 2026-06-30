'use client';

import { PlanetData, ConstellationData, SatellitePass, NightWindow } from './types';

export function scorePlanet(planet: PlanetData, night: NightWindow): number {
  if (!planet.isVisible || planet.transitAltitude < 15) return 0;

  // Peak altitude factor (40%)
  const altitudeFactor = Math.min(planet.transitAltitude / 90, 1.0) * 40;

  // Darkness visibility factor (30%)
  const visibilityFactor = Math.min(planet.visibleHours / 8, 1.0) * 30;

  // Brightness factor (20%): magnitude -5 = max brightness, +5 = barely visible
  const brightnessFactor = Math.max(0, Math.min(1, (5 - planet.magnitude) / 6)) * 20;

  // Prime-time factor (10%)
  let primeTimeFactor = 0;
  if (planet.transitTime) {
    const hour = planet.transitTime.getHours();
    if (hour >= 20 || hour === 0) {
      primeTimeFactor = 10;
    } else if (hour >= 1 && hour <= 3) {
      primeTimeFactor = 5;
    }
  }

  return Math.round(altitudeFactor + visibilityFactor + brightnessFactor + primeTimeFactor);
}

export function scoreConstellation(constellation: ConstellationData, night: NightWindow): number {
  if (!constellation.isVisible || constellation.peakAltitude < 15) return 0;

  // Peak altitude factor (40%)
  const altitudeFactor = Math.min(constellation.peakAltitude / 75, 1.0) * 40;

  // Visibility duration factor (30%)
  const visibilityFactor = Math.min(constellation.visibleHours / 8, 1.0) * 30;

  // Brightness factor (20%): brighter reference stars, different scale
  const brightnessFactor = Math.max(0, Math.min(1, (3 - constellation.magnitude) / 4)) * 20;

  // Prime-time factor (10%)
  let primeTimeFactor = 0;
  if (constellation.peakTime) {
    const hour = constellation.peakTime.getHours();
    if (hour >= 20 || hour === 0) {
      primeTimeFactor = 10;
    } else if (hour >= 1 && hour <= 3) {
      primeTimeFactor = 5;
    }
  }

  return Math.round(altitudeFactor + visibilityFactor + brightnessFactor + primeTimeFactor);
}

export function scoreSatellitePass(pass: SatellitePass): number {
  // Max altitude factor (50%)
  const altitudeFactor = Math.min(pass.maxAltitude / 90, 1.0) * 50;

  // Duration factor (30%): 10+ minutes is max
  const durationFactor = Math.min(pass.duration / 10, 1.0) * 30;

  // Prime-time factor (20%)
  const hour = pass.startTime.getHours();
  let primeTimeFactor = 10;
  if (hour >= 20 && hour <= 23) {
    primeTimeFactor = 20;
  } else if (hour >= 0 && hour <= 1) {
    primeTimeFactor = 15;
  }

  return Math.round(altitudeFactor + durationFactor + primeTimeFactor);
}

export function applyScores<T extends { viewingScore: number }>(
  items: T[],
  scorer: (item: T) => number
): T[] {
  return items
    .map((item) => ({ ...item, viewingScore: scorer(item) }))
    .sort((a, b) => b.viewingScore - a.viewingScore);
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 30) return 'Fair';
  return 'Poor';
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-blue-400';
  if (score >= 30) return 'text-yellow-400';
  return 'text-red-400';
}
