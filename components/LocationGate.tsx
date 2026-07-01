'use client';

import { useState, useEffect } from 'react';
import type { ObserverLocation } from '@/lib/types';

const STORAGE_KEY = 'gaze-away-location';

export function clearLocation(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface LocationGateProps {
  onLocation: (location: ObserverLocation) => void;
}

export function LocationGate({ onLocation }: LocationGateProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [savedLocation, setSavedLocation] = useState<ObserverLocation | null>(null);

  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ObserverLocation;
        if (
          typeof parsed.lat === 'number' &&
          typeof parsed.lon === 'number' &&
          !isNaN(parsed.lat) &&
          !isNaN(parsed.lon)
        ) {
          setSavedLocation(parsed);
          onLocation(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setShowPrompt(true);
  }, [onLocation]);

  function saveAndNotify(location: ObserverLocation) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    setSavedLocation(location);
    setShowPrompt(false);
    onLocation(location);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              name = data.display_name as string;
            }
          }
        } catch {
          // fall back to coordinate string
        }
        setLoading(false);
        saveAndNotify({ lat: latitude, lon: longitude, name });
      },
      (err) => {
        setLoading(false);
        setError(`Location access denied: ${err.message}`);
      }
    );
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a number between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be a number between -180 and 180.');
      return;
    }
    saveAndNotify({ lat, lon, name: manualName.trim() || undefined });
  }

  function handleChangeLocation() {
    setSavedLocation(null);
    setShowPrompt(true);
    setError(null);
    setManualLat('');
    setManualLon('');
    setManualName('');
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl">
        <div className="mb-5 flex justify-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-violet-500/20 text-3xl ring-1 ring-white/10">
            🔭
          </span>
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-white">
          Where are you observing from?
        </h1>
        <p className="mb-8 text-center text-sm text-star-blue">
          We use your location to calculate exactly what&apos;s visible in your sky tonight.
        </p>

        {savedLocation && (
          <div className="mb-6 text-center">
            <p className="text-[#8ab4d4] text-sm">
              Current location:{' '}
              <span className="text-white">
                {savedLocation.name ?? `${savedLocation.lat.toFixed(4)}, ${savedLocation.lon.toFixed(4)}`}
              </span>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Detecting...
            </>
          ) : (
            <>
              <span>Use My Location</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2a4a6e]/50" />
          <span className="text-[#8ab4d4] text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-[#2a4a6e]/50" />
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-[#8ab4d4] font-medium uppercase tracking-wider">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 40.7128"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="bg-[#0d1726] border border-[#2a4a6e]/50 rounded-lg px-3 py-2 text-white placeholder-[#4a6a8e] text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-[#8ab4d4] font-medium uppercase tracking-wider">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. -74.006"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="bg-[#0d1726] border border-[#2a4a6e]/50 rounded-lg px-3 py-2 text-white placeholder-[#4a6a8e] text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8ab4d4] font-medium uppercase tracking-wider">
              Location Name <span className="normal-case text-[#4a6a8e]">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. New York City"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="bg-[#0d1726] border border-[#2a4a6e]/50 rounded-lg px-3 py-2 text-white placeholder-[#4a6a8e] text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 mt-1"
          >
            Set Location
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        {savedLocation && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setSavedLocation(null);
                setShowPrompt(false);
                onLocation(savedLocation);
              }}
              className="text-[#8ab4d4] hover:text-white text-sm underline underline-offset-2 transition-colors"
            >
              Keep current location
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
