import React from 'react';
import { cn } from './cn';

export const LoadBar: React.FC<{ pct: number; className?: string; height?: string }> = ({
  pct,
  className,
  height = 'h-2'
}) => {
  const clamped = Math.max(0, Math.min(140, pct));
  const tone =
    pct >= 100 ? 'bg-rose-500 shadow-[0_0_12px_rgba(251,113,133,0.55)]' : pct >= 85 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className={cn('w-full rounded-full bg-slate-800/80 overflow-hidden', height, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', tone)}
        style={{ width: `${Math.min(100, clamped)}%` }}
      />
    </div>
  );
};
