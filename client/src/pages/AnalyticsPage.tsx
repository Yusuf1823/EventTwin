import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Activity } from 'lucide-react';
import { ChartTooltip } from '../ui/ChartTooltip';
import { PageHeader } from '../ui/PageHeader';
import { GlassCard } from '../ui/GlassCard';
import { SectionHeader } from '../ui/SectionHeader';
import { StatCard } from '../ui/StatCard';
import { SegmentedControl } from '../ui/SegmentedControl';

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'2 HOURS' | '6 HOURS' | '12 HOURS' | '24 HOURS'>('6 HOURS');
  const [eventMeta, setEventMeta] = useState<any>(null);
  const [predictionsData, setPredictionsData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => { if (data.event) setEventMeta(data.event); })
      .catch(err => console.warn('Failed to fetch events in analytics:', err));

    fetch('/api/predictions')
      .then(res => res.json())
      .then(data => { if (data.success || data.horizonsData) setPredictionsData(data); })
      .catch(err => console.warn('Failed to fetch predictions in analytics:', err));
  }, []);

  const currentStress    = eventMeta?.cityStressPct ?? 69;
  const currentTransit   = eventMeta?.transitLoadPct ?? 70;
  const currentParking   = eventMeta?.parkingLoadPct ?? 63;
  const currentVenue     = eventMeta?.venueLoadPct ?? 84;
  const currentVisitorsK = eventMeta?.currentVisitorsSimulated
    ? Math.round(eventMeta.currentVisitorsSimulated / 1000)
    : 500;

  const forecastSourceLabel = predictionsData?.source === 'ml' ? 'Forecast (ML)' : 'Forecast (fallback)';

  const getTimeData = () => {
    const f15 = predictionsData?.horizonsData?.['15min']?.stressIndex ?? Math.round(currentStress * 1.06);
    const f30 = predictionsData?.horizonsData?.['30min']?.stressIndex ?? Math.round(currentStress * 1.10);
    const f45 = predictionsData?.horizonsData?.['45min']?.stressIndex ?? Math.round(currentStress * 1.14);

    const futurePoints = [
      { time: '+15m', visitors: Math.round(currentVisitorsK * 1.03), forecastStress: f15 },
      { time: '+30m', visitors: Math.round(currentVisitorsK * 1.06), forecastStress: f30 },
      { time: '+45m', visitors: Math.round(currentVisitorsK * 1.09), forecastStress: f45 }
    ];

    switch (timeframe) {
      case '2 HOURS': return [
        { time: '19:30', visitors: Math.round(currentVisitorsK * 0.78), venue: Math.round(currentVenue * 0.85), transit: Math.round(currentTransit * 0.82), parking: Math.round(currentParking * 0.80), stress: Math.round(currentStress * 0.82) },
        { time: '20:00', visitors: Math.round(currentVisitorsK * 0.88), venue: Math.round(currentVenue * 0.92), transit: Math.round(currentTransit * 0.90), parking: Math.round(currentParking * 0.88), stress: Math.round(currentStress * 0.91) },
        { time: '20:30', visitors: Math.round(currentVisitorsK * 0.95), venue: Math.round(currentVenue * 0.97), transit: Math.round(currentTransit * 0.96), parking: Math.round(currentParking * 0.95), stress: Math.round(currentStress * 0.96) },
        { time: '21:00 NOW', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
        ...futurePoints
      ];
      case '6 HOURS': return [
        { time: '15:00', visitors: Math.round(currentVisitorsK * 0.35), venue: Math.round(currentVenue * 0.45), transit: Math.round(currentTransit * 0.40), parking: Math.round(currentParking * 0.42), stress: Math.round(currentStress * 0.42) },
        { time: '17:00', visitors: Math.round(currentVisitorsK * 0.58), venue: Math.round(currentVenue * 0.68), transit: Math.round(currentTransit * 0.65), parking: Math.round(currentParking * 0.62), stress: Math.round(currentStress * 0.65) },
        { time: '19:00', visitors: Math.round(currentVisitorsK * 0.82), venue: Math.round(currentVenue * 0.88), transit: Math.round(currentTransit * 0.85), parking: Math.round(currentParking * 0.84), stress: Math.round(currentStress * 0.86) },
        { time: '21:00 NOW', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
        ...futurePoints
      ];
      case '12 HOURS': return [
        { time: '09:00', visitors: Math.round(currentVisitorsK * 0.12), venue: Math.round(currentVenue * 0.18), transit: Math.round(currentTransit * 0.22), parking: Math.round(currentParking * 0.20), stress: Math.round(currentStress * 0.20) },
        { time: '12:00', visitors: Math.round(currentVisitorsK * 0.28), venue: Math.round(currentVenue * 0.36), transit: Math.round(currentTransit * 0.38), parking: Math.round(currentParking * 0.35), stress: Math.round(currentStress * 0.35) },
        { time: '15:00', visitors: Math.round(currentVisitorsK * 0.50), venue: Math.round(currentVenue * 0.60), transit: Math.round(currentTransit * 0.58), parking: Math.round(currentParking * 0.55), stress: Math.round(currentStress * 0.58) },
        { time: '18:00', visitors: Math.round(currentVisitorsK * 0.78), venue: Math.round(currentVenue * 0.86), transit: Math.round(currentTransit * 0.84), parking: Math.round(currentParking * 0.80), stress: Math.round(currentStress * 0.82) },
        { time: '21:00 NOW', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
        ...futurePoints
      ];
      case '24 HOURS':
      default: return [
        { time: '00:00', visitors: Math.round(currentVisitorsK * 0.05), venue: Math.round(currentVenue * 0.08), transit: Math.round(currentTransit * 0.10), parking: Math.round(currentParking * 0.12), stress: Math.round(currentStress * 0.10) },
        { time: '06:00', visitors: Math.round(currentVisitorsK * 0.08), venue: Math.round(currentVenue * 0.12), transit: Math.round(currentTransit * 0.15), parking: Math.round(currentParking * 0.14), stress: Math.round(currentStress * 0.13) },
        { time: '12:00', visitors: Math.round(currentVisitorsK * 0.30), venue: Math.round(currentVenue * 0.38), transit: Math.round(currentTransit * 0.40), parking: Math.round(currentParking * 0.38), stress: Math.round(currentStress * 0.38) },
        { time: '18:00', visitors: Math.round(currentVisitorsK * 0.72), venue: Math.round(currentVenue * 0.82), transit: Math.round(currentTransit * 0.80), parking: Math.round(currentParking * 0.76), stress: Math.round(currentStress * 0.79) },
        { time: '21:00 NOW', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
        ...futurePoints
      ];
    }
  };

  const timeData = getTimeData();

  const CHART_GRID_PROPS = {
    strokeDasharray: '2 4',
    stroke: 'rgba(148,163,184,0.08)',
    vertical: false,
  };

  const AXIS_PROPS = {
    stroke: 'transparent',
    tick: { fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: false,
    tickLine: false,
  };

  return (
    <div className="flex flex-col gap-6 page-enter">

      {/* ── HEADER ── */}
      <PageHeader
        title="Analytics"
        accent={
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Telemetry Intelligence</span>
          </div>
        }
        subtitle="Temporal telemetry across venues, transit, parking, and city stress."
        actions={
          <SegmentedControl
            value={timeframe}
            onChange={setTimeframe}
            options={(['2 HOURS', '6 HOURS', '12 HOURS', '24 HOURS'] as const).map(tf => ({ id: tf, label: tf }))}
          />
        }
      />

      {/* ── LIVE KPI STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="City Stress" value={currentStress} suffix="%" color="#f43f5e" variant="critical" mode="plain" subLabel="Live index" />
        <StatCard label="Venue Load" value={currentVenue} suffix="%" color="#a855f7" variant="default" mode="plain" subLabel="Live %" />
        <StatCard label="Transit" value={currentTransit} suffix="%" color="#22d3ee" variant="default" mode="plain" subLabel="Platform throughput" />
        <StatCard label="Parking" value={currentParking} suffix="%" color="#10b981" variant="safe" mode="plain" subLabel="Hub capacity" />
      </div>

      {/* ── CHART 1: Stress + Forecast overlay ── */}
      <GlassCard className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <SectionHeader
            title="City Hospitality Stress & Predictive Horizon"
            subtitle="Peak strain with forward trajectory overlay (30% Mobility · 25% Venue · 20% Parking · 15% Hotel · 10% Imbalance)"
            color="rose"
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/30">
              {forecastSourceLabel}
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/30">
              Current: {currentStress}%
            </span>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeData}>
              <defs>
                <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}  />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="time" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} domain={[20, 110]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: '#64748b' }} />
              <ReferenceLine y={100} stroke="rgba(251,113,133,0.4)" strokeDasharray="4 3" label={{ value: 'Critical', fill: '#fb7185', fontSize: 9 }} />
              <Area type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#stressGrad)" name="Live Stress %" />
              <Line type="monotone" dataKey="forecastStress" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#38bdf8' }} name={forecastSourceLabel} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ── CHART GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Visitor Flow */}
        <GlassCard className="flex flex-col gap-5">
          <SectionHeader
            title="Visitor Flow (Thousands)"
            subtitle="Cumulative attendees across Mumbai BKC ecosystem"
            color="violet"
          />
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData} barCategoryGap="35%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="time" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="visitors" fill="url(#barGrad)" radius={[5, 5, 0, 0]} name="Visitors (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Cross-sector comparison */}
        <GlassCard className="flex flex-col gap-5">
          <SectionHeader
            title="Cross-Sector Load Comparison (%)"
            subtitle="Transit vs Venue vs Parking saturation over time"
            color="cyan"
          />
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <defs>
                  <linearGradient id="areaTransit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="time" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} domain={[20, 115]} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={100} stroke="rgba(251,113,133,0.3)" strokeDasharray="4 3" />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px', color: '#64748b' }} />
                <Line type="monotone" dataKey="transit" stroke="#06b6d4" strokeWidth={2} dot={false} name="Transit %" />
                <Line type="monotone" dataKey="venue"   stroke="#a855f7" strokeWidth={2} dot={false} name="Venue %"   />
                <Line type="monotone" dataKey="parking" stroke="#10b981" strokeWidth={2} dot={false} name="Parking %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
