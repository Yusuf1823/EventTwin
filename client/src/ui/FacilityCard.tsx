import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LocationItem } from '../data/mumbaiLocations';
import { GlassCard } from './GlassCard';
import { RiskBadge } from './RiskBadge';
import { LoadBar } from './LoadBar';
import { AnimatedStat } from './AnimatedStat';

export const FacilityCard: React.FC<{
  location: LocationItem;
  extra?: React.ReactNode;
}> = ({ location, extra }) => {
  const status = location.simulated?.status || 'NORMAL';
  const load = location.simulated?.loadPct ?? 0;
  return (
    <GlassCard hover className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-white leading-snug">{location.name}</h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">
            {location.category} · {location.zone}
          </p>
        </div>
        <RiskBadge risk={status}>
          {status} · {load}%
        </RiskBadge>
      </div>

      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
        <div className="text-emerald-400 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" /> Verified location
        </div>
        <div>
          <strong className="text-slate-400">Address:</strong> {location.real.address}
        </div>
        {location.real.publishedCapacity && (
          <div>
            <strong className="text-slate-400">Spec:</strong> {location.real.publishedCapacity}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-cyan-300 font-mono uppercase tracking-wider">Simulated load</span>
          <AnimatedStat value={load} suffix="%" className="text-sm font-bold text-white" />
        </div>
        <LoadBar pct={load} />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>
            Current: <strong className="text-white">{location.simulated.currentVisitors.toLocaleString()}</strong>
          </span>
          <span>
            Cap: <strong className="text-white">{location.simulated.capacity.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed italic border-t border-white/5 pt-3">
        “{location.simulated.aiNote}”
      </p>
      {extra}
    </GlassCard>
  );
};
