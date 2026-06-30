'use client';

import { useState } from 'react';
import type { ObserverLocation } from '@/lib/types';
import { clearLocation, LocationGate } from '@/components/LocationGate';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const [location, setLocation] = useState<ObserverLocation | null>(null);

  if (!location) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <LocationGate onLocation={setLocation} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Dashboard location={location} onChangeLocation={() => { clearLocation(); setLocation(null); }} />
    </main>
  );
}
