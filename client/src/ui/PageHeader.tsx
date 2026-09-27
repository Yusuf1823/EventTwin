import React from 'react';
import { cn } from './cn';

export const PageHeader: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  accent?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, accent, className }) => (
  <div className={cn('flex flex-col gap-3 pb-1', className)}>
    {/* Top row */}
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex flex-col gap-1 min-w-0">
        {accent && (
          <div className="flex items-center gap-2 mb-0.5">{accent}</div>
        )}
        <h1 className="font-display text-[1.65rem] sm:text-[1.85rem] font-extrabold text-white tracking-tight leading-none">
          {title}
        </h1>
        {subtitle && (
          <div className="text-[11.5px] text-slate-400 leading-relaxed mt-0.5 font-normal">
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 mt-0.5">
          {actions}
        </div>
      )}
    </div>

    {/* Decorative separator */}
    <div className="h-px w-full bg-gradient-to-r from-cyan-500/30 via-indigo-500/20 to-transparent" />
  </div>
);
