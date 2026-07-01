'use client';

export function PanelHeader({
  emoji,
  title,
  count,
  accent,
}: {
  emoji: string;
  title: string;
  count?: number;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-2">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <span className="text-xl">{emoji}</span>
        {title}
      </h2>
      {typeof count === 'number' && (
        <span className={`rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold ${accent}`}>
          {count} up tonight
        </span>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass animate-pulse rounded-2xl border border-white/8 p-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>
        <div className="h-11 w-11 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2 w-1/2 rounded bg-white/5" />
            <div className="h-3 w-3/4 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div className="glass flex flex-col items-center gap-2 rounded-2xl border border-white/8 px-4 py-10 text-center">
      <span className="text-3xl opacity-60">{emoji}</span>
      <p className="max-w-[16rem] text-sm text-slate-400">{message}</p>
    </div>
  );
}
