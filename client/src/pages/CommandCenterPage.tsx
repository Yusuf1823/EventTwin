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
  Building,
  Info,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MapPin,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { RealMumbaiMap } from '../components/RealMumbaiMap';
import { REAL_MUMBAI_LOCATIONS, LocationItem } from '../data/mumbaiLocations';

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

  // Fetch real-time digital twin data from server API
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
          setLocations(twinData.locations);
          setSelectedLocation((prev) => {
            if (!prev) return twinData.locations[0];
            return twinData.locations.find((l: LocationItem) => l.id === prev.id) || twinData.locations[0];
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

  // Live simulation time heartbeat
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner (Phase 17) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              MUMBAI EVENT COMMAND CENTER
            </h1>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 border border-indigo-500/40">
              JWCC BKC CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Real locations</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-medium">Simulated operational data</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-emerald-400">🟢 SIMULATION RUNNING</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">Updated {secondsAgo}s ago</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh Telemetry from Server"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* NEXT CRITICAL EVENT KPI BANNER (PREDICTIVE INTELLIGENCE) */}
      {nextCriticalEvent ? (
        <div
          onClick={() => navigate('/predictions')}
          className="glass-panel p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 glow-red cursor-pointer hover:bg-rose-950/30 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                NEXT CRITICAL EVENT FORECAST
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                <span className="text-rose-300 font-bold">{nextCriticalEvent.resource}</span> reaches critical threshold ({nextCriticalEvent.projectedLoad || '100%+'} load){' '}
                <span className="text-amber-300 font-mono font-bold">
                  {nextCriticalEvent.minutesUntilCritical === 0
                    ? 'in 0m (active overload)'
                    : `in approx ${nextCriticalEvent.minutesUntilCritical} minutes`}
                </span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-300 hover:text-white shrink-0">
            <span>VIEW PREDICTIONS</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div
          onClick={() => navigate('/predictions')}
          className="glass-panel px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition"
        >
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">NEXT CRITICAL EVENT:</span>
            <span className="text-slate-400">All infrastructure assets projected within safe capacity limits across next 45 minutes.</span>
          </div>
          <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
            <span>Forecast Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* 6 SIMPLE KPI CARDS (PHASE 18) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* CITY STRESS */}
        <div className="glass-panel p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-rose-300 font-bold flex items-center gap-1">
                CITY STRESS
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <Info className="w-3 h-3" />
                </button>
              </span>
              <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-rose-400">{eventMeta?.cityStressPct ?? 69}%</div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            EventTwin Stress Index (30% Mobility, 25% Venue, 20% Parking, 15% Hotel, 10% Imbalance)
          </p>

          {/* Tooltip (Phase 18 & 33) */}
          {showTooltip && (
            <div className="absolute inset-0 bg-slate-950/95 p-3 text-[10.5px] text-slate-300 z-30 flex items-center leading-relaxed">
              {eventMeta?.cityStressExplanation || "Dynamically calculated from EventTwin Stress Index (30% Mobility + 25% Venue + 20% Parking + 15% Hotel + 10% Demand Imbalance)."}
            </div>
          )}
        </div>

        {/* VISITORS */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-bold">VISITORS</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {eventMeta?.currentVisitorsSimulated ? `${Math.round(eventMeta.currentVisitorsSimulated / 1000)}K+` : '500K+'}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            Conserved scale across Mumbai
          </p>
        </div>

        {/* CRITICAL AREAS */}
        <div className="glass-panel p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-amber-300 font-bold">CRITICAL AREAS</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{eventMeta?.criticalAreasCount ?? 3}</div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            Facilities exceeding 90% load
          </p>
        </div>

        {/* TRANSIT LOAD */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-bold">TRANSIT LOAD</span>
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300">{eventMeta?.transitLoadPct ?? 70}%</div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            Platform throughput across network
          </p>
        </div>

        {/* PARKING */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-bold">PARKING</span>
              <Car className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{eventMeta?.parkingLoadPct ?? 63}%</div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            Capacity used across hubs
          </p>
        </div>

        {/* HOTEL OCCUPANCY */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-bold">HOTEL OCCUPANCY</span>
              <Hotel className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">{eventMeta?.hotelOccupancyPct ?? 77}%</div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            Average BKC & Airport occupancy
          </p>
        </div>
      </div>

      {/* MAIN REAL-MAP DIGITAL TWIN (PHASE 19, 20, 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Real Map Canvas (Col 8) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">LIVE DIGITAL TWIN</h2>
              <p className="text-xs text-slate-400">
                Real Mumbai locations with simulated event conditions.
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bandra Kurla Complex • 19.0638° N, 72.8682° E</span>
            </div>
          </div>

          {/* Real Map Container */}
          <div className="w-full h-[380px] sm:h-[460px] lg:h-[540px]">
            <RealMumbaiMap
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />
          </div>
        </div>

        {/* Location Details Panel (Col 4 - Phase 20, 21) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          {selectedLocation ? (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                    {selectedLocation.category} • {selectedLocation.zone}
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                      selectedLocation.simulated.status === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : selectedLocation.simulated.status === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {selectedLocation.simulated.status}
                  </span>
                </div>
                <h3 className="text-base font-black text-white leading-snug">
                  {selectedLocation.name}
                </h3>
              </div>

              {/* REAL LOCATION ACCORDION (PHASE 5 & 37) */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED REAL MUMBAI LOCATION</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Address:</strong> {selectedLocation.real.address}
                </p>
                <div className="text-[10.5px] text-slate-500 font-mono">
                  Coordinates: {selectedLocation.real.latitude.toFixed(4)}°N, {selectedLocation.real.longitude.toFixed(4)}°E
                </div>
                {selectedLocation.real.publishedCapacity && (
                  <div className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <strong>Published Spec:</strong> {selectedLocation.real.publishedCapacity}
                  </div>
                )}
              </div>

              {/* SIMULATED OPERATIONAL DATA (PHASE 5, 20, 21, 38) */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-indigo-500/30 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    SIMULATED OPERATIONAL DATA
                  </span>
                  <span className="text-[10px] text-slate-500">Demo Stream</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{selectedLocation.simulated.operationalMetricLabel}</span>
                  <span className="text-white font-bold font-mono text-sm">
                    {selectedLocation.simulated.loadPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedLocation.simulated.status === 'CRITICAL'
                        ? 'bg-rose-500'
                        : selectedLocation.simulated.status === 'HIGH'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, selectedLocation.simulated.loadPct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  <span>Current: <strong>{selectedLocation.simulated.currentVisitors.toLocaleString()}</strong></span>
                  <span>Capacity: <strong>{selectedLocation.simulated.capacity.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* AI EXPLANATION BOX (PHASE 20) */}
              <div className="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/40 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  AI Explanation:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{selectedLocation.simulated.aiNote}"
                </p>
              </div>

              {/* View Prediction Button */}
              <button
                onClick={() => navigate('/predictions')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <span>VIEW PREDICTION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500">
              Select a location marker on the real map to view telemetry.
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Verified JWCC Precinct Coordinates</span>
            <span className="text-emerald-400 font-mono">● Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
