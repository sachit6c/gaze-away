'use client';

import type { PlanetData, ConstellationData, SatellitePass } from '@/lib/types';

export type ObjectCardProps = {
  title: string;
  subtitle?: string;
  description?: string;
  score: number;
  details: { label: string; value: string }[];
  type: 'planet' | 'constellation' | 'satellite';
  isTopPick?: boolean;
};

export function formatTime(date: Date | null): string {
  if (!date) return '--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500 text-white';
  if (score >= 50) return 'bg-blue-500 text-white';
  if (score >= 30) return 'bg-yellow-500 text-black';
  return 'bg-red-500 text-white';
}

function getTypeEmoji(type: ObjectCardProps['type']): string {
  switch (type) {
    case 'planet':
      return '🪐';
    case 'constellation':
      return '✨';
    case 'satellite':
      return '🛰️';
  }
}

export function ObjectCard({
  title,
  subtitle,
  description,
  score,
  details,
  type,
  isTopPick = false,
}: ObjectCardProps) {
  const scoreColor = getScoreColor(score);
  const emoji = getTypeEmoji(type);

  return (
    <div className="relative bg-[#0d1726]/80 border border-[#2a4a6e]/50 rounded-xl p-4 hover:border-[#3d6d9e]/70 transition-all overflow-hidden">
      {isTopPick && (
        <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-br-lg">
          TOP PICK
        </div>
      )}

      {/* Score badge */}
      <div
        className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${scoreColor}`}
      >
        {Math.round(score)}
      </div>

      {/* Header */}
      <div className="flex items-start gap-2 pr-12 mt-1">
        <span className="text-2xl leading-none mt-0.5">{emoji}</span>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-base leading-tight truncate">{title}</h3>
          {subtitle && (
            <p className="text-gray-400 text-xs mt-0.5 leading-snug">{subtitle}</p>
          )}
          {description && (
            <p className="text-gray-500 text-xs mt-1 leading-snug">{description}</p>
          )}
        </div>
      </div>

      {/* Details grid */}
      {details.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {details.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-gray-500 text-[10px] uppercase tracking-wide leading-none">
                {label}
              </span>
              <span className="text-gray-200 text-xs font-medium mt-0.5">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
