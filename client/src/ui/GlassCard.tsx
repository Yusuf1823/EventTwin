import React from 'react';
import { cn } from './cn';

export type GlassCardVariant = 'default' | 'critical' | 'warn' | 'safe' | 'ai' | 'elevated';

const VARIANT_STYLES: Record<GlassCardVariant, string> = {
  default:  'glass-panel border-white/8',
  elevated: 'bg-[rgba(16,24,38,0.92)] backdrop-blur-2xl border-white/12 shadow-[0_24px_48px_rgba(0,0,0,0.35)]',
  critical: 'glass-panel border-rose-500/35 bg-rose-950/12 shadow-[0_0_28px_rgba(251,113,133,0.12)]',
  warn:     'glass-panel border-amber-500/30 bg-amber-950/10 shadow-[0_0_24px_rgba(251,191,36,0.10)]',
  safe:     'glass-panel border-emerald-500/25 bg-emerald-950/10',
  ai:       'glass-panel border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_24px_rgba(34,211,238,0.08)]',
};

export const GlassCard: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    padded?: boolean;
    variant?: GlassCardVariant;
  }
> = ({ className, hover = false, padded = true, variant = 'default', children, ...props }) => (
  <div
    className={cn(
      'rounded-2xl border',
      VARIANT_STYLES[variant],
      padded && 'p-5',
      hover && 'glass-panel-hover cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
