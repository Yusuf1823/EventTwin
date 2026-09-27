import React from 'react';
import { cn } from './cn';
import { AnimatedStat } from './AnimatedStat';
import { Sparkline, sparkFrom } from './Sparkline';
import { LoadBar } from './LoadBar';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type StatCardMode = 'sparkline' | 'loadbar' | 'plain';

export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delta?: number;          // % change vs previous window
  color?: string;          // hex for sparkline / value
  mode?: StatCardMode;
  icon?: React.ReactNode;
  subLabel?: string;
  variant?: 'default' | 'featured' | 'critical' | 'warn' | 'safe';
  className?: string;
}

const VARIANT_MAP: Record<string, string> = {
  default:  'glass-panel border-white/8',
  featured: 'glass-panel border-cyan-500/30 bg-cyan-950/10',
  critical: 'glass-panel border-rose-500/35 bg-rose-950/12',
  warn:     'glass-panel border-amber-500/30 bg-amber-950/10',
  safe:     'glass-panel border-emerald-500/25 bg-emerald-950/10',
};

const VALUE_COLOR: Record<string, string> = {
  default:  'text-white',
  featured: 'text-cyan-300',
  critical: 'text-rose-400',
  warn:     'text-amber-400',
  safe:     'text-emerald-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  label, value, suffix = '', prefix = '', decimals = 0,
  delta, color = '#22d3ee', mode = 'sparkline', icon,
  subLabel, variant = 'default', className
}) => {
  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const deltaColor = delta === undefined || delta === 0
    ? 'text-slate-500'
    : delta > 0 ? 'text-rose-400' : 'text-emerald-400';

  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col gap-2.5 transition-all duration-200', VARIANT_MAP[variant], className)}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
          {label}
        </span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <AnimatedStat
          value={value}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
          className={cn('text-[1.75rem] font-extrabold leading-none', VALUE_COLOR[variant])}
        />
        {delta !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-mono font-bold ml-1', deltaColor)}>
            <DeltaIcon className="w-3 h-3" />
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      {/* Chart or bar */}
      {mode === 'sparkline' && (
        <Sparkline values={sparkFrom(value)} color={color} className="w-full h-9" />
      )}
      {mode === 'loadbar' && (
        <LoadBar pct={value} height="h-1.5" />
      )}

      {/* Sub-label */}
      {subLabel && (
        <p className="text-[10px] text-slate-500 leading-snug">{subLabel}</p>
      )}
    </div>
  );
};
