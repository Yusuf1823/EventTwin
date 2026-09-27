import React from 'react';
import { cn } from './cn';

const TONE: Record<string, string> = {
  CRITICAL: 'bg-rose-500/15 text-rose-300 border-rose-500/40 glow-red et-risk-pulse',
  HIGH: 'bg-amber-500/15 text-amber-300 border-amber-500/40 glow-yellow',
  ATTENTION: 'bg-amber-500/15 text-amber-300 border-amber-500/40 glow-yellow',
  MODERATE: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  LOW: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 glow-green',
  NORMAL: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 glow-green',
  AVAILABLE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'AI INSIGHT': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  'PREDICTED CRITICAL RISK': 'bg-rose-500/20 text-rose-200 border-rose-400/50 glow-red et-risk-pulse'
};

export function riskFromLoad(load: number) {
  if (load >= 100) return 'CRITICAL';
  if (load >= 85) return 'HIGH';
  if (load >= 70) return 'MODERATE';
  return 'LOW';
}

export const RiskBadge: React.FC<{ risk?: string; className?: string; children?: React.ReactNode }> = ({
  risk = 'NORMAL',
  className,
  children
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wide',
      TONE[risk] || TONE.NORMAL,
      className
    )}
  >
    {children ?? risk}
  </span>
);
