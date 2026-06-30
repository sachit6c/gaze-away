export interface ObserverLocation {
  lat: number;
  lon: number;
  name?: string;
}

export interface NightWindow {
  eveningTwilight: Date;
  morningTwilight: Date;
  darkHours: number;
}

export interface PlanetData {
  name: string;
  body: string;
  altitude: number;
  azimuth: number;
  riseTime: Date | null;
  setTime: Date | null;
  transitTime: Date | null;
  transitAltitude: number;
  magnitude: number;
  constellation: string;
  viewingScore: number;
  isVisible: boolean;
  visibleHours: number;
}

export interface ConstellationData {
  name: string;
  abbreviation: string;
  description: string;
  ra: number;
  dec: number;
  bestSeason: string;
  magnitude: number;
  riseTime: Date | null;
  setTime: Date | null;
  peakTime: Date | null;
  peakAltitude: number;
  viewingScore: number;
  isVisible: boolean;
  visibleHours: number;
}

export interface SatellitePass {
  satelliteName: string;
  noradId: number;
  startTime: Date;
  endTime: Date;
  maxTime: Date;
  maxAltitude: number;
  startAzimuth: number;
  maxAzimuth: number;
  endAzimuth: number;
  duration: number;
  viewingScore: number;
}

export interface TLEData {
  name: string;
  noradId: number;
  line1: string;
  line2: string;
}

export interface ConstellationJSON {
  name: string;
  abbreviation: string;
  description: string;
  ra: number;
  dec: number;
  bestSeason: string;
  magnitude: number;
}
