import React from 'react';
import { cn } from './cn';

/**
 * SectionHeader — subsection title within a GlassCard.
 * Renders a left accent bar + title + optional right slot.
 */
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  color?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'violet';
  className?: string;
}> = ({ title, subtitle, right, color = 'cyan', className }) => {
  const barColor = {
    cyan:    'bg-cyan-400',
    rose:    'bg-rose-400',
    amber:   'bg-amber-400',
    emerald: 'bg-emerald-400',
    violet:  'bg-violet-400',
  }[color];

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex items-start gap-2.5">
        <span className={cn('mt-0.5 w-[3px] h-full min-h-[18px] rounded-full shrink-0 self-stretch', barColor)} />
        <div>
          <h2 className="font-display text-[13px] font-bold text-white tracking-tight leading-none">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
};
