// Shared display formatting helpers.

const COMPASS_16 = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

/** Convert an azimuth in degrees (0 = North, clockwise) to a 16-point compass label. */
export function azimuthToCompass(azimuth: number): string {
  const idx = Math.round(((azimuth % 360) + 360) % 360 / 22.5) % 16;
  return COMPASS_16[idx];
}

/** e.g. "Look SE" with the numeric bearing, for "where to point" guidance. */
export function directionLabel(azimuth: number): string {
  return `${azimuthToCompass(azimuth)} · ${Math.round(((azimuth % 360) + 360) % 360)}°`;
}

/** Human altitude phrasing: how high above the horizon. */
export function altitudePhrase(altitude: number): string {
  if (altitude >= 70) return 'near overhead';
  if (altitude >= 45) return 'high in the sky';
  if (altitude >= 25) return 'mid-sky';
  if (altitude >= 10) return 'low on the horizon';
  return 'at the horizon';
}

export function formatTimeShort(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
