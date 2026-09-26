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
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'2 HOURS' | '6 HOURS' | '12 HOURS' | '24 HOURS'>('6 HOURS');
  const [eventMeta, setEventMeta] = useState<any>(null);
  const [predictionsData, setPredictionsData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.event) setEventMeta(data.event);
      })
      .catch(err => console.warn('Failed to fetch events in analytics:', err));

    fetch('/api/predictions')
      .then(res => res.json())
      .then(data => {
        if (data.success || data.horizonsData) setPredictionsData(data);
      })
      .catch(err => console.warn('Failed to fetch predictions in analytics:', err));
  }, []);

  const currentStress = eventMeta?.cityStressPct ?? 69;
  const currentTransit = eventMeta?.transitLoadPct ?? 70;
  const currentParking = eventMeta?.parkingLoadPct ?? 63;
  const currentVenue = eventMeta?.venueLoadPct ?? 84;
  const currentVisitorsK = eventMeta?.currentVisitorsSimulated ? Math.round(eventMeta.currentVisitorsSimulated / 1000) : 500;

  const forecastSourceLabel = predictionsData?.source === 'ml' ? 'Forecast (ML)' : 'Forecast (fallback)';

  // Dynamic series based on selected timeframe
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
      case '2 HOURS':
        return [
          { time: '19:30', visitors: Math.round(currentVisitorsK * 0.78), venue: Math.round(currentVenue * 0.85), transit: Math.round(currentTransit * 0.82), parking: Math.round(currentParking * 0.80), stress: Math.round(currentStress * 0.82) },
          { time: '20:00', visitors: Math.round(currentVisitorsK * 0.88), venue: Math.round(currentVenue * 0.92), transit: Math.round(currentTransit * 0.90), parking: Math.round(currentParking * 0.88), stress: Math.round(currentStress * 0.91) },
          { time: '20:30', visitors: Math.round(currentVisitorsK * 0.95), venue: Math.round(currentVenue * 0.97), transit: Math.round(currentTransit * 0.96), parking: Math.round(currentParking * 0.95), stress: Math.round(currentStress * 0.96) },
          { time: '21:00 (NOW)', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
          ...futurePoints
        ];

      case '6 HOURS':
        return [
          { time: '15:00', visitors: Math.round(currentVisitorsK * 0.35), venue: Math.round(currentVenue * 0.45), transit: Math.round(currentTransit * 0.40), parking: Math.round(currentParking * 0.42), stress: Math.round(currentStress * 0.42) },
          { time: '17:00', visitors: Math.round(currentVisitorsK * 0.58), venue: Math.round(currentVenue * 0.68), transit: Math.round(currentTransit * 0.65), parking: Math.round(currentParking * 0.62), stress: Math.round(currentStress * 0.65) },
          { time: '19:00', visitors: Math.round(currentVisitorsK * 0.82), venue: Math.round(currentVenue * 0.88), transit: Math.round(currentTransit * 0.85), parking: Math.round(currentParking * 0.84), stress: Math.round(currentStress * 0.86) },
          { time: '21:00 (NOW)', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
          ...futurePoints
        ];

      case '12 HOURS':
        return [
          { time: '09:00', visitors: Math.round(currentVisitorsK * 0.12), venue: Math.round(currentVenue * 0.18), transit: Math.round(currentTransit * 0.22), parking: Math.round(currentParking * 0.20), stress: Math.round(currentStress * 0.20) },
          { time: '12:00', visitors: Math.round(currentVisitorsK * 0.28), venue: Math.round(currentVenue * 0.36), transit: Math.round(currentTransit * 0.38), parking: Math.round(currentParking * 0.35), stress: Math.round(currentStress * 0.35) },
          { time: '15:00', visitors: Math.round(currentVisitorsK * 0.50), venue: Math.round(currentVenue * 0.60), transit: Math.round(currentTransit * 0.58), parking: Math.round(currentParking * 0.55), stress: Math.round(currentStress * 0.58) },
          { time: '18:00', visitors: Math.round(currentVisitorsK * 0.78), venue: Math.round(currentVenue * 0.86), transit: Math.round(currentTransit * 0.84), parking: Math.round(currentParking * 0.80), stress: Math.round(currentStress * 0.82) },
          { time: '21:00 (NOW)', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
          ...futurePoints
        ];

      case '24 HOURS':
      default:
        return [
          { time: '00:00', visitors: Math.round(currentVisitorsK * 0.05), venue: Math.round(currentVenue * 0.08), transit: Math.round(currentTransit * 0.10), parking: Math.round(currentParking * 0.12), stress: Math.round(currentStress * 0.10) },
          { time: '06:00', visitors: Math.round(currentVisitorsK * 0.08), venue: Math.round(currentVenue * 0.12), transit: Math.round(currentTransit * 0.15), parking: Math.round(currentParking * 0.14), stress: Math.round(currentStress * 0.13) },
          { time: '12:00', visitors: Math.round(currentVisitorsK * 0.30), venue: Math.round(currentVenue * 0.38), transit: Math.round(currentTransit * 0.40), parking: Math.round(currentParking * 0.38), stress: Math.round(currentStress * 0.38) },
          { time: '18:00', visitors: Math.round(currentVisitorsK * 0.72), venue: Math.round(currentVenue * 0.82), transit: Math.round(currentTransit * 0.80), parking: Math.round(currentParking * 0.76), stress: Math.round(currentStress * 0.79) },
          { time: '21:00 (NOW)', visitors: currentVisitorsK, venue: currentVenue, transit: currentTransit, parking: currentParking, stress: currentStress, forecastStress: currentStress },
          ...futurePoints
        ];
    }
  };

  const timeData = getTimeData();


  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal telemetry trends across venues, transit, parking, and city stress.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          {(['2 HOURS', '6 HOURS', '12 HOURS', '24 HOURS'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart 1: City Hospitality Stress Trend with Predictive Forecast Overlay */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">City Hospitality Stress & Predictive Horizon</h2>
            <p className="text-xs text-slate-400">Peak strain with forward trajectory overlay (30% Mobility, 25% Venue, 20% Parking, 15% Hotel, 10% Imbalance)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/30">
              {forecastSourceLabel}
            </span>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30">
              Current: {currentStress}%
            </span>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeData}>
              <defs>
                <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[30, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Area type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#stressGrad)" name="Historical / Live Stress %" />
              <Line type="monotone" dataKey="forecastStress" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} name={forecastSourceLabel} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Visitor Flow & Sector Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Visitor Flow */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Visitor Flow (Thousands)</h2>
            <p className="text-xs text-slate-400">Cumulative attendees participating across Mumbai BKC ecosystem</p>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="visitors" fill="#6366f1" radius={[4, 4, 0, 0]} name="Visitors (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Comparison (Transit, Parking, Venue) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cross-Sector Load Comparison (%)</h2>
            <p className="text-xs text-slate-400">Transit vs Venue vs Parking saturation</p>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[30, 110]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="transit" stroke="#06b6d4" strokeWidth={2} name="Transit %" />
                <Line type="monotone" dataKey="venue" stroke="#a855f7" strokeWidth={2} name="Venue %" />
                <Line type="monotone" dataKey="parking" stroke="#10b981" strokeWidth={2} name="Parking %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
