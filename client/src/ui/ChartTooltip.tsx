import React from 'react';

export const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0a101c]/97 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl min-w-[150px]">
      <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2 pb-1.5 border-b border-white/6">
        {label}
      </div>
      <div className="flex flex-col gap-1.5">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-5 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.stroke || p.fill }} />
              {p.name}
            </span>
            <span className="font-mono font-bold text-white tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
