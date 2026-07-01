'use client';

import { getScoreLabel } from '@/lib/scoring';

export type ObjectCardProps = {
  title: string;
  subtitle?: string;
  description?: string;
  score: number;
  details: { label: string; value: string }[];
  type: 'planet' | 'constellation' | 'satellite';
  isTopPick?: boolean;
  /** Optional "where to look" guidance, e.g. { direction: 'SE · 135°', altitude: 'high in the sky' } */
  look?: { direction: string; altitude?: string };
  dimmed?: boolean;
};

export function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

type Tone = {
  ring: string; // stroke color
  text: string; // text color
  chip: string; // badge bg/border
  glow: string; // box-shadow color for top pick
};

function scoreTone(score: number): Tone {
  if (score >= 70)
    return { ring: '#34d399', text: 'text-emerald-300', chip: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30', glow: 'rgba(52,211,153,0.35)' };
  if (score >= 50)
    return { ring: '#60a5fa', text: 'text-sky-300', chip: 'bg-sky-400/10 text-sky-300 border-sky-400/30', glow: 'rgba(96,165,250,0.35)' };
  if (score >= 30)
    return { ring: '#fbbf24', text: 'text-amber-300', chip: 'bg-amber-400/10 text-amber-300 border-amber-400/30', glow: 'rgba(251,191,36,0.3)' };
  return { ring: '#f87171', text: 'text-rose-300', chip: 'bg-rose-400/10 text-rose-300 border-rose-400/30', glow: 'rgba(248,113,113,0.25)' };
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

function ScoreGauge({ score, tone }: { score: number; tone: Tone }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;

  return (
    <div className="relative flex-shrink-0" style={{ width: 46, height: 46 }}>
      <svg viewBox="0 0 46 46" className="-rotate-90">
        <circle cx="23" cy="23" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="23"
          cy="23"
          r={r}
          fill="none"
          stroke={tone.ring}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${tone.text}`}>
        {Math.round(score)}
      </span>
    </div>
  );
}

export function ObjectCard({
  title,
  subtitle,
  description,
  score,
  details,
  type,
  isTopPick = false,
  look,
  dimmed = false,
}: ObjectCardProps) {
  const tone = scoreTone(score);
  const emoji = getTypeEmoji(type);

  return (
    <div
      className={`group relative glass rounded-2xl p-4 transition-all duration-300 ${
        dimmed ? 'opacity-55 hover:opacity-90' : ''
      } ${
        isTopPick
          ? 'border border-amber-300/40 ring-1 ring-amber-300/20'
          : 'border border-white/8 hover:border-sky-400/40'
      } hover:-translate-y-0.5`}
      style={isTopPick ? { boxShadow: `0 0 40px -12px ${tone.glow}` } : undefined}
    >
      {isTopPick && (
        <div className="absolute -top-2 left-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-lg">
          ★ Top Pick
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl leading-none drop-shadow">{emoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <ScoreGauge score={score} tone={tone} />
          <span className={`text-[10px] font-medium uppercase tracking-wide ${tone.text}`}>
            {getScoreLabel(score)}
          </span>
        </div>
      </div>

      {description && <p className="mt-2 text-xs leading-snug text-slate-500">{description}</p>}

      {/* Where to look */}
      {look && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tone.chip}`}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeLinecap="round" />
              <path d="m15 9-2.5 5.5L7 17l2.5-5.5L15 9Z" fill="currentColor" stroke="none" />
            </svg>
            Look {look.direction}
          </span>
          {look.altitude && (
            <span className="text-xs text-slate-400">{look.altitude}</span>
          )}
        </div>
      )}

      {/* Details grid */}
      {details.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/5 pt-3 sm:grid-cols-3">
          {details.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide leading-none text-slate-500">
                {label}
              </span>
              <span className="mt-1 text-xs font-medium text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
