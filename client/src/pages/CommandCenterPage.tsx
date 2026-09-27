import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Users,
  AlertTriangle,
  Navigation,
  Car,
  Hotel,
  Info,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Zap
} from 'lucide-react';
import { WeatherHUD } from '../components/WeatherHUD';
import { RealMumbaiMap } from '../components/RealMumbaiMap';
import { NugenCopilot } from '../components/NugenCopilot';
import { useTutorial } from '../tutorial/TutorialContext';
import { REAL_MUMBAI_LOCATIONS, LocationItem } from '../data/mumbaiLocations';
import { GlassCard } from '../ui/GlassCard';
import { PageHeader } from '../ui/PageHeader';
import { SectionHeader } from '../ui/SectionHeader';
import { StatCard } from '../ui/StatCard';
import { AnimatedStat } from '../ui/AnimatedStat';
import { Sparkline, sparkFrom } from '../ui/Sparkline';
import { RiskBadge } from '../ui/RiskBadge';
import { LoadBar } from '../ui/LoadBar';
import { Skeleton } from '../ui/Skeleton';

export const CommandCenterPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<LocationItem[]>(REAL_MUMBAI_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(REAL_MUMBAI_LOCATIONS[0]);
  const [secondsAgo, setSecondsAgo] = useState(6);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventMeta, setEventMeta] = useState<any>(null);
  const [nextCriticalEvent, setNextCriticalEvent] = useState<any>(null);
  const { updateTutorialData } = useTutorial();

  const fetchTwinData = async () => {
    setIsLoading(true);
    try {
      const [twinRes, evtRes, predRes] = await Promise.all([
        fetch('/api/digital-twin'),
        fetch('/api/events'),
        fetch('/api/predictions')
      ]);
      if (twinRes.ok) {
        const twinData = await twinRes.json();
        if (twinData.locations && twinData.locations.length > 0) {
          const mergedLocations: LocationItem[] = twinData.locations.map((loc: any) => {
            const fallback = REAL_MUMBAI_LOCATIONS.find(r => r.id === loc.id) || REAL_MUMBAI_LOCATIONS[0];
            return {
              ...fallback,
              ...loc,
              real: { ...fallback.real, ...(loc.real || {}) },
              simulated: {
                ...fallback.simulated,
                ...(loc.simulated || {})
              }
            };
          });
          setLocations(mergedLocations);
          setSelectedLocation((prev) => {
            if (!prev) return mergedLocations[0];
            return mergedLocations.find((l: LocationItem) => l.id === prev.id) || mergedLocations[0];
          });
        }
      }
      if (evtRes.ok) {
        const evtData = await evtRes.json();
        setEventMeta(evtData.event);
      }
      if (predRes.ok) {
        const predData = await predRes.json();
        setNextCriticalEvent(predData.nextCriticalEvent || null);
      }
    } catch (err) {
      console.warn('Backend API fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTwinData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setSecondsAgo(0);
    try {
      await fetch('/api/digital-twin/run', { method: 'POST' });
      await fetchTwinData();
    } catch (err) {
      console.warn('Heartbeat trigger error:', err);
    }
  };

  const cityStress  = eventMeta?.cityStressPct ?? 69;
  const visitorsK   = eventMeta?.currentVisitorsSimulated ? Math.round(eventMeta.currentVisitorsSimulated / 1000) : 500;
  
  useEffect(() => {
    updateTutorialData({ cityStress });
  }, [cityStress]);

  const criticalAreas = eventMeta?.criticalAreasCount ?? 3;
  const transitLoad = eventMeta?.transitLoadPct ?? 70;
  const parkingLoad = eventMeta?.parkingLoadPct ?? 63;
  const hotelOcc    = eventMeta?.hotelOccupancyPct ?? 77;
  const locStatus   = selectedLocation?.simulated?.status || 'NORMAL';
  const locLoad     = selectedLocation?.simulated?.loadPct ?? 50;

  return (
    <div className="flex flex-col gap-6 page-enter">

      {/* ── PAGE HEADER ── */}
      <PageHeader
        title="Mumbai Command Center"
        accent={
          <>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              JWCC · BKC CORE
            </span>
            <span className="text-[10px] font-mono text-slate-500">PRECINCT ID: MH-01-BKC</span>
          </>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>Operator <strong className="text-slate-200">{user?.name || 'Alex'}</strong></span>
            <span className="text-slate-700">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Verified geography
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-cyan-400">Simulated operational telemetry</span>
          </span>
        }
        actions={
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 et-heartbeat" />
              <span className="font-mono font-bold text-emerald-300">SIM RUNNING</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono text-[11px]">Updated {secondsAgo}s ago</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="et-btn et-btn-ghost p-2"
              title="Refresh Telemetry from Server"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </>
        }
      />

      {/* ── CRITICAL EVENT BANNER ── */}
      {nextCriticalEvent ? (
        <button
          type="button"
          onClick={() => navigate('/predictions')}
          className="glass-panel p-4 rounded-2xl border border-rose-500/50 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 glow-red cursor-pointer hover:bg-rose-950/30 transition text-left et-alert-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 et-risk-pulse">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Next critical event forecast
              </span>
              <p className="text-sm font-semibold text-white mt-0.5">
                <span className="text-rose-300">{nextCriticalEvent.resource}</span> reaches critical threshold (
                {nextCriticalEvent.projectedLoad || '100%+'} load){' '}
                <span className="text-amber-300 font-mono font-bold">
                  {nextCriticalEvent.minutesUntilCritical === 0
                    ? 'in 0m (active overload)'
                    : `in approx ${nextCriticalEvent.minutesUntilCritical} minutes`}
                </span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-300 shrink-0">
            <span>VIEW PREDICTIONS</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/predictions')}
          className="glass-panel px-4 py-3 rounded-2xl border border-white/8 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition text-left"
        >
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">System nominal:</span>
            <span className="text-slate-400">
              All infrastructure assets projected within safe capacity limits across next 45 minutes.
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
            Forecast matrix <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* ── KPI STAT GRID ── */}
      {isLoading && !eventMeta ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* City Stress — featured/wide */}
          <div className="col-span-2 relative" data-tutorial="stress-index">
            <StatCard
              label="City Stress Index"
              value={cityStress}
              suffix="%"
              color="#fb7185"
              variant="critical"
              mode="sparkline"
              icon={<Activity className="w-4 h-4 et-heartbeat" />}
              subLabel="30% Mobility · 25% Venue · 20% Parking · 15% Hotel"
              className="h-full"
            />
            {showTooltip && (
              <div className="absolute inset-0 z-30 bg-[#05080f]/96 p-4 rounded-2xl text-[11px] text-slate-300 flex items-center leading-relaxed">
                {eventMeta?.cityStressExplanation ||
                  'EventTwin Stress Index: dynamically calculated from 30% Mobility + 25% Venue + 20% Parking + 15% Hotel + 10% Demand Imbalance.'}
              </div>
            )}
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="absolute top-4 right-12 text-slate-500 hover:text-white z-40"
              aria-label="City stress info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          <StatCard
            label="Visitors"
            value={visitorsK}
            suffix="K+"
            color="#818cf8"
            variant="default"
            mode="sparkline"
            icon={<Users className="w-3.5 h-3.5 text-indigo-400" />}
            subLabel="Conserved scale · simulated"
          />

          <StatCard
            label="Critical Areas"
            value={criticalAreas}
            color="#fbbf24"
            variant="warn"
            mode="sparkline"
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            subLabel="Facilities > 90% load"
          />

          <StatCard
            label="Transit Load"
            value={transitLoad}
            suffix="%"
            color="#22d3ee"
            variant="default"
            mode="loadbar"
            icon={<Navigation className="w-3.5 h-3.5 text-cyan-400" />}
            subLabel="Platform throughput"
          />

          <StatCard
            label="Parking"
            value={parkingLoad}
            suffix="%"
            color="#34d399"
            variant="default"
            mode="loadbar"
            icon={<Car className="w-3.5 h-3.5 text-emerald-400" />}
            subLabel="Hub capacity used"
          />
        </div>
      )}

      {/* ── MAIN GRID: MAP + LOCATION PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map card */}
        <GlassCard className="lg:col-span-8 flex flex-col gap-4" padded={false} data-tutorial="digital-twin-map">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <SectionHeader
              title="Live Digital Twin"
              subtitle="Real Mumbai locations with simulated event conditions"
              color="cyan"
            />
            <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              BKC · 19.0638°N, 72.8682°E
            </div>
          </div>
          <div className="w-full h-[380px] sm:h-[460px] lg:h-[520px] relative">
            <WeatherHUD />
            <RealMumbaiMap
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />
          </div>
        </GlassCard>

        {/* Location inspector */}
        <GlassCard className="lg:col-span-4 flex flex-col justify-between" variant="elevated">
          {selectedLocation ? (
            <div className="flex flex-col gap-4">
              {/* Location header */}
              <div className="flex items-start justify-between gap-2 border-b border-white/8 pb-4">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-cyan-400 font-bold border border-white/10 w-fit">
                    {selectedLocation.category} · {selectedLocation.zone}
                  </span>
                  <h3 className="font-display text-[15px] font-bold text-white leading-snug">
                    {selectedLocation.name}
                  </h3>
                </div>
                <RiskBadge risk={locStatus} />
              </div>

              {/* Verified real location */}
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified real Mumbai location
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Address:</strong> {selectedLocation.real?.address || 'Bandra Kurla Complex, Mumbai'}
                </p>
                <div className="text-[10.5px] text-slate-500 font-mono">
                  {(selectedLocation.real?.latitude || 19.0638).toFixed(4)}°N,{' '}
                  {(selectedLocation.real?.longitude || 72.8682).toFixed(4)}°E
                </div>
                {selectedLocation.real?.publishedCapacity && (
                  <div className="text-[10.5px] text-slate-400 pt-1 border-t border-white/8">
                    <strong>Spec:</strong> {selectedLocation.real.publishedCapacity}
                  </div>
                )}
              </div>

              {/* Operational telemetry */}
              <div className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    Simulated Telemetry
                  </span>
                  <span className="text-[10px] text-slate-500">Live</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {selectedLocation.simulated?.operationalMetricLabel || 'Operational Load'}
                  </span>
                  <AnimatedStat value={locLoad} suffix="%" className="text-white font-bold text-base" />
                </div>
                <LoadBar pct={locLoad} />
                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/8">
                  <span>
                    Current: <strong>{(selectedLocation.simulated?.currentVisitors || 0).toLocaleString()}</strong>
                  </span>
                  <span>
                    Cap: <strong>{(selectedLocation.simulated?.capacity || 1000).toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* AI note */}
              <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/25 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  AI Context
                </span>
                <p className="text-[11.5px] text-slate-200 leading-relaxed italic">
                  "{selectedLocation.simulated?.aiNote || 'Operating within standard city parameters.'}"
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/predictions')}
                className="et-btn et-btn-primary w-full py-2.5 text-[11px]"
              >
                <Zap className="w-3.5 h-3.5" />
                RUN PREDICTION
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500">
              Select a location marker on the map to inspect telemetry.
            </div>
          )}

          <div className="pt-4 border-t border-white/8 text-[10.5px] text-slate-600 flex items-center justify-between mt-4">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> JWCC precinct coordinates
            </span>
            <span className="text-emerald-400 font-mono">● Active</span>
          </div>
        </GlassCard>
      </div>

      {/* Hotel occupancy strip — standalone KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Hotel Occupancy"
          value={hotelOcc}
          suffix="%"
          color="#a78bfa"
          variant="default"
          mode="loadbar"
          icon={<Hotel className="w-3.5 h-3.5 text-violet-400" />}
          subLabel="BKC & airport corridor average"
        />
        <GlassCard className="md:col-span-2 flex items-center gap-4 py-3" padded={false}>
          <div className="flex-1 px-5">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-cyan-300 font-semibold">AI Operational Summary:</span>{' '}
              {eventMeta?.aiSummary || 'City stress is within manageable bounds. BKC Metro and parking hubs approaching peak load windows. Pre-emptive flow management recommended for the next 30-minute window.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/nugen')}
            className="et-btn et-btn-ghost px-4 py-2 mr-4 text-[11px] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Nugen AI
          </button>
        </GlassCard>
      </div>

      {/* ── NUGEN COPILOT ── */}
      <NugenCopilot
        currentMetrics={{
          cityStress,
          venueLoad: 84,
          transitLoad,
          parkingLoad,
          hotelOccupancy: hotelOcc
        }}
      />
    </div>
  );
};
