import React from 'react';
import { cn } from './cn';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { id: T; label: React.ReactNode }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center overflow-x-auto bg-slate-950/70 border border-white/8 rounded-xl p-1 text-xs gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0',
            value === opt.id
              ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
