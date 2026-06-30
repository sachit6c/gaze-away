'use client';

import { useRef } from 'react';

interface DateSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export function DateSelector({ date, onChange }: DateSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (current.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const canGoBack = diffDays > -30;
  const canGoForward = diffDays < 30;

  function handlePrev() {
    if (canGoBack) {
      onChange(shiftDays(date, -1));
    }
  }

  function handleNext() {
    if (canGoForward) {
      onChange(shiftDays(date, 1));
    }
  }

  function handleCalendarClick() {
    inputRef.current?.showPicker?.();
    inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!val) return;
    const [year, month, day] = val.split('-').map(Number);
    const picked = new Date(year, month - 1, day);
    if (!isNaN(picked.getTime())) {
      onChange(picked);
    }
  }

  const label = isToday(date) ? 'Tonight' : formatDate(date);

  return (
    <div className="bg-[#0d1726]/60 border border-[#2a4a6e]/40 rounded-xl px-4 py-3 inline-flex items-center gap-4">
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canGoBack}
        aria-label="Previous day"
        className="text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none select-none"
      >
        &#9664;
      </button>

      <span className="text-white font-medium min-w-[7rem] text-center select-none">
        {label}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoForward}
        aria-label="Next day"
        className="text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none select-none"
      >
        &#9654;
      </button>

      <button
        type="button"
        onClick={handleCalendarClick}
        aria-label="Open calendar"
        className="text-blue-400 hover:text-blue-300 transition-colors relative"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <input
          ref={inputRef}
          type="date"
          value={toLocalDateString(date)}
          min={toLocalDateString(shiftDays(today, -30))}
          max={toLocalDateString(shiftDays(today, 30))}
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          aria-hidden="true"
          tabIndex={-1}
        />
      </button>
    </div>
  );
}
