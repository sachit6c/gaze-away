import { NextResponse } from 'next/server';
import type { TLEData } from '@/lib/types';

let cache: { data: TLEData[]; timestamp: number } | null = null;
const CACHE_TTL = 3600000; // 1 hour in ms

const CURATED_NORAD_IDS = [25544, 20580, 48274, 43013];
const STARLINK_LIMIT = 15;

function parseTLEText(text: string): TLEData[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: TLEData[] = [];

  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];

    // Basic sanity check: line1 starts with '1 ' and line2 starts with '2 '
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      continue;
    }

    // Extract NORAD ID from characters 2-7 of line1 (0-indexed: positions 2..6)
    const noradId = parseInt(line1.substring(2, 7).trim(), 10);

    if (isNaN(noradId)) {
      continue;
    }

    results.push({ name, noradId, line1, line2 });
  }

  return results;
}

async function fetchTLEGroup(url: string): Promise<TLEData[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch TLEs from ${url}: ${response.status}`);
  }
  const text = await response.text();
  return parseTLEText(text);
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetch curated individual satellites
    const curatedPromises = CURATED_NORAD_IDS.map((id) =>
      fetchTLEGroup(
        `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`
      ).catch((err) => {
        console.error(`Failed to fetch NORAD ${id}:`, err);
        return [] as TLEData[];
      })
    );

    // Fetch space stations group
    const stationsPromise = fetchTLEGroup(
      'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE'
    ).catch((err) => {
      console.error('Failed to fetch stations group:', err);
      return [] as TLEData[];
    });

    // Fetch Starlink top satellites
    const starlinkPromise = fetchTLEGroup(
      'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE'
    ).catch((err) => {
      console.error('Failed to fetch Starlink group:', err);
      return [] as TLEData[];
    });

    const [stationsTLEs, starlinkTLEs, ...curatedGroups] = await Promise.all([
      stationsPromise,
      starlinkPromise,
      ...curatedPromises,
    ]);

    const starlinkLimited = starlinkTLEs.slice(0, STARLINK_LIMIT);

    // Merge all results, deduplicating by noradId (curated individual fetches
    // may overlap with the stations group)
    const seen = new Set<number>();
    const merged: TLEData[] = [];

    const addAll = (list: TLEData[]) => {
      for (const tle of list) {
        if (!seen.has(tle.noradId)) {
          seen.add(tle.noradId);
          merged.push(tle);
        }
      }
    };

    // Priority: individual curated > stations group > starlink
    for (const group of curatedGroups) {
      addAll(group);
    }
    addAll(stationsTLEs);
    addAll(starlinkLimited);

    cache = { data: merged, timestamp: Date.now() };
    return NextResponse.json(merged);
  } catch (err) {
    console.error('TLE route error:', err);
    // Return stale cache if available
    if (cache) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json(
      { error: 'Failed to fetch TLE data' },
      { status: 500 }
    );
  }
}
