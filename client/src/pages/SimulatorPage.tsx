import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, ArrowRight, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, CloudRain, Clock, Bus, Car, Satellite, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { NugenCopilot } from '../components/NugenCopilot';
import { useTutorial } from '../tutorial/TutorialContext';
import { PageHeader } from '../ui/PageHeader';
import { SectionHeader } from '../ui/SectionHeader';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedStat } from '../ui/AnimatedStat';
import { LoadBar } from '../ui/LoadBar';
import { RiskBadge } from '../ui/RiskBadge';

interface SimulationState {
  before: {
    cityStress: number;
    transitLoad: number;
    parkingLoad: number;
    venueLoad: number;
    hotelOccupancy: number;
    criticalZones: number;
    zoneALoad?: number;
    zoneCLoad?: number;
  };
  after: {
    cityStress: number;
    transitLoad: number;
    parkingLoad: number;
    venueLoad: number;
    hotelOccupancy: number;
    criticalZones: number;
    zoneALoad?: number;
    zoneCLoad?: number;
  };
  reduction: {
    cityStress: number;
    venueLoad: number;
    transitLoad: number;
    parkingLoad: number;
  };
  rippleEffects?: {
    rain?: {
      rainfallImpactPct: number;
      rainfallIntensityMmHr?: number;
      temperatureC?: number;
      stormDurationHours?: number;
      floodingSeverity?: string;
      roadCapacityDropPct: number;
      shuttleTravelTimeMinutes: number;
      arrivalConcentrationSurgePct: number;
      parkingDwellSurgePct: number;
    };
    hospitality?: {
      coreHotelsOccupancyShiftPct: number;
      distantHotelsOccupancyDropPct: number;
      strandedTravelersEst: number;
      restaurantIndoorSurgePct: number;
      restaurantOutdoorDropPct: number;
      workforceAvailabilityPct: number;
      commuterDelayMinutes: number;
      emergencyPonchosDeployed: number;
      dewateringPumpsActive: number;
      generatorReserveKw: number;
    };
    transitSpillover?: {
      transitReductionPct: number;
      effectiveTransitCapacityPct: number;
      spilloverToRoadPct: number;
    };
    venueGate?: {
      ingressDelayMinutes: number;
      effectiveCapacityPct: number;
    };
  };
  probabilisticUncertainty?: {
    confidenceLevel: number;
    confidenceInterval: [number, number];
    standardError: number;
    riskVariance: string;
    modelReliability: string;
  };
  explainability: {
    why: string;
    action: string;
    expectedEffect: string;
    tradeOff: string;
  };
}

const DEFAULT_SIM_DATA: SimulationState = {
  before: {
    cityStress: 69,
    transitLoad: 70,
    parkingLoad: 63,
    venueLoad: 84,
    hotelOccupancy: 77,
    criticalZones: 3,
    zoneALoad: 88,
    zoneCLoad: 50
  },
  after: {
    cityStress: 91,
    transitLoad: 104,
    parkingLoad: 88,
    venueLoad: 131,
    hotelOccupancy: 84,
    criticalZones: 4,
    zoneALoad: 125,
    zoneCLoad: 55
  },
  reduction: {
    cityStress: 0,
    venueLoad: 0,
    transitLoad: 0,
    parkingLoad: 0
  },
  explainability: {
    why: "Zone A is forecast to reach 125% capacity under elevated scenario load.",
    action: "Redirect 15% of inbound visitors toward Zone C and shift 22% vehicles to Kalina overflow lot.",
    expectedEffect: "Relieves Zone A venue pressure and stabilizes transit platform queues.",
    tradeOff: "Increases Zone C load safely into available surplus capacity."
  }
};

export const SimulatorPage: React.FC = () => {
  // Scenario Controls
  const [visitorIncreasePct, setVisitorIncreasePct] = useState(30);
  const [transitReductionPct, setTransitReductionPct] = useState(0);
  const [parkingReductionPct, setParkingReductionPct] = useState(0);
  const [shuttleReductionPct, setShuttleReductionPct] = useState(0);
  const [rainImpactPct, setRainImpactPct] = useState(0);
  const [rainfallIntensity, setRainfallIntensity] = useState(0); // mm/hr
  const [stormDuration, setStormDuration] = useState(1);         // hours
  const [temperature, setTemperature] = useState(30);            // °C
  const [floodingSeverity, setFloodingSeverity] = useState('NONE');
  const [venueDelayMinutes, setVenueDelayMinutes] = useState(0);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isRebalanced, setIsRebalanced] = useState(false);
  const [simData, setSimData] = useState<SimulationState>(DEFAULT_SIM_DATA);
  const [liveWeatherMode, setLiveWeatherMode] = useState(false);
  const [liveWeatherData, setLiveWeatherData] = useState<any>(null);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const { markActionComplete } = useTutorial();

  const handleSliderAction = () => {
    markActionComplete('simulator_moved');
  };

  // Apply one-click preset scenarios for quick demonstration
  const applyPreset = (preset: 'monsoon' | 'heatwave' | 'drizzle' | 'baseline') => {
    handleSliderAction();
    setIsRebalanced(false);
    if (preset === 'monsoon') {
      setVisitorIncreasePct(30);
      setRainfallIntensity(40);
      setRainImpactPct(45);
      setStormDuration(4);
      setTemperature(26);
      setFloodingSeverity('CRITICAL');
      setTransitReductionPct(30);
      setShuttleReductionPct(25);
      setVenueDelayMinutes(30);
    } else if (preset === 'heatwave') {
      setVisitorIncreasePct(20);
      setRainfallIntensity(0);
      setRainImpactPct(0);
      setStormDuration(5);
      setTemperature(42);
      setFloodingSeverity('NONE');
      setTransitReductionPct(15);
      setShuttleReductionPct(10);
      setVenueDelayMinutes(15);
    } else if (preset === 'drizzle') {
      setVisitorIncreasePct(25);
      setRainfallIntensity(5);
      setRainImpactPct(15);
      setStormDuration(2);
      setTemperature(28);
      setFloodingSeverity('LOW');
      setTransitReductionPct(10);
      setShuttleReductionPct(5);
      setVenueDelayMinutes(10);
    } else {
      setVisitorIncreasePct(20);
      setRainfallIntensity(0);
      setRainImpactPct(0);
      setStormDuration(1);
      setTemperature(29);
      setFloodingSeverity('NONE');
      setTransitReductionPct(0);
      setShuttleReductionPct(0);
      setParkingReductionPct(0);
      setVenueDelayMinutes(0);
    }
  };

  // Fetch live weather and auto-fill sliders
  const syncLiveWeather = async () => {
    setFetchingWeather(true);
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      setLiveWeatherData(data);
      if (data.current) {
        setTemperature(Math.round(data.current.temperature || 30));
        setRainfallIntensity(Math.round(data.current.rain || data.current.precipitation || 0));
      }
      if (data.impact?.simulationParams) {
        setRainImpactPct(Math.min(50, data.impact.simulationParams.rainImpactPct));
      }
      if (data.impact?.waterloggingRisk) {
        setFloodingSeverity(data.impact.waterloggingRisk);
      }
    } catch (err) {
      console.warn('Failed to fetch live weather for simulator:', err);
    } finally {
      setFetchingWeather(false);
    }
  };

  useEffect(() => {
    if (liveWeatherMode) {
      syncLiveWeather();
      const interval = setInterval(syncLiveWeather, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [liveWeatherMode]);

  // Run simulation on server
  const runSimulation = async (rebalanced = false) => {
    setIsSimulating(true);
    try {
      const endpoint = rebalanced ? '/api/interventions/simulate' : '/api/simulation';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorIncreasePct,
          transitReductionPct,
          parkingReductionPct,
          shuttleReductionPct,
          rainImpactPct,
          rainfallIntensity,
          temperature,
          stormDuration,
          floodingSeverity,
          venueDelayMinutes,
          isRebalanced: rebalanced
        })
      });

      if (res.ok) {
        const data = await res.json();
        const payload = data.simulation || data;
        if (payload.before && payload.after) {
          setSimData({
            before: payload.before,
            after: payload.after,
            reduction: payload.reduction || {
              cityStress: Math.max(0, payload.before.cityStress - payload.after.cityStress),
              venueLoad: Math.max(0, payload.before.venueLoad - payload.after.venueLoad),
              transitLoad: Math.max(0, payload.before.transitLoad - payload.after.transitLoad),
              parkingLoad: Math.max(0, payload.before.parkingLoad - payload.after.parkingLoad)
            },
            rippleEffects: payload.rippleEffects,
            probabilisticUncertainty: payload.probabilisticUncertainty,
            explainability: payload.explainability || DEFAULT_SIM_DATA.explainability
          });
        }
      }
    } catch (err) {
      console.warn('API simulation fallback:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Initial simulation run on mount
  useEffect(() => {
    runSimulation(false);
  }, []);

  const handleRunSimulation = () => {
    setIsRebalanced(false);
    runSimulation(false);
  };

  const handleSimulateRebalancing = async () => {
    setIsRebalanced(true);
    await runSimulation(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const { before, after, explainability, rippleEffects } = simData;

  return (
    <div className="flex flex-col gap-6 page-enter">
      <PageHeader
        title="What-If Simulator"
        accent={
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Dynamic Scenario Engine</span>
          </div>
        }
        subtitle="Simulate what happens if conditions change — visitor surge, monsoon, transit failure — and compute prescriptive rebalancing."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Scenario Controls (Col 5) */}
        <GlassCard className="lg:col-span-5 flex flex-col justify-between gap-5" variant="elevated" data-tutorial="simulator-controls">
          <div>
            <SectionHeader
              title="Scenario Controls"
              subtitle="Adjust variables to simulate forward load shifts"
              color="violet"
              className="border-b border-white/8 pb-3 mb-4"
              right={
                <span className="text-[10px] font-mono text-violet-400 font-bold bg-violet-950/40 px-2 py-1 rounded border border-violet-500/30">
                  AI TWIN
                </span>
              }
            />

            {/* 1-Click Preset Demonstrations */}
            <div className="mb-4 p-3 rounded-xl bg-black/30 border border-white/8">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> Quick-load weather scenarios
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => applyPreset('monsoon')}
                  className="p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-bold text-left transition cursor-pointer"
                >
                  ⛈️ Monsoon Cloudburst
                  <span className="block text-[9px] text-slate-400 font-normal">40mm/hr • Flooding Choke</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('heatwave')}
                  className="p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 font-bold text-left transition cursor-pointer"
                >
                  🔥 Peak Heatwave
                  <span className="block text-[9px] text-slate-400 font-normal">42°C • Grid & AC Strain</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('drizzle')}
                  className="p-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 font-bold text-left transition cursor-pointer"
                >
                  🌧️ Low Drizzle
                  <span className="block text-[9px] text-slate-400 font-normal">5mm/hr • High Umbrellas</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('baseline')}
                  className="p-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 font-bold text-left transition cursor-pointer"
                >
                  ☀️ Clear Optimal
                  <span className="block text-[9px] text-slate-400 font-normal">29°C • Stable Flows</span>
                </button>
              </div>
            </div>

            {/* Control 1: Visitor Increase */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">Visitor Increase (0–100%)</span>
                <span className="font-mono font-bold text-cyan-300 text-xs">+{visitorIncreasePct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={visitorIncreasePct}
                onChange={(e) => {
                  setVisitorIncreasePct(parseInt(e.target.value));
                  setIsRebalanced(false);
                  handleSliderAction();
                }}
                className="et-range"
              />
            </div>

            {/* Live Weather Mode Toggle */}
            <div className="mb-3.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">LIVE OPEN-METEO SYNC</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveWeatherMode(!liveWeatherMode)}
                  className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${
                    liveWeatherMode ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: liveWeatherMode ? '22px' : '2px' }}
                  />
                </button>
              </div>
              {liveWeatherMode && liveWeatherData && (
                <div className="mt-2 text-[10px] text-slate-300 flex items-center gap-2 font-mono">
                  <span className="text-emerald-400">● LIVE</span>
                  <span>{liveWeatherData.current?.weatherIcon} {liveWeatherData.current?.weatherLabel}</span>
                  <span>• {temperature}°C</span>
                  <span>• Rain: {rainfallIntensity}mm/hr</span>
                </div>
              )}
              {liveWeatherMode && fetchingWeather && (
                <div className="mt-2 text-[10px] text-cyan-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing with Open-Meteo...
                </div>
              )}
            </div>

            {/* Weather Parameter: Rainfall Intensity */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rainfall Intensity (0–60 mm/hr)
                </span>
                <span className="font-mono font-bold text-blue-300 text-xs">{rainfallIntensity} mm/h</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={rainfallIntensity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setRainfallIntensity(val);
                  setRainImpactPct(Math.min(50, Math.round(val * 1.5)));
                  if (val > 25) setFloodingSeverity('CRITICAL');
                  else if (val > 10) setFloodingSeverity('HIGH');
                  else if (val > 2) setFloodingSeverity('MODERATE');
                  else setFloodingSeverity('NONE');
                  setIsRebalanced(false);
                  if (liveWeatherMode) setLiveWeatherMode(false);
                  handleSliderAction();
                }}
                className="et-range"
              />
            </div>

            {/* Weather Parameter: Storm Duration & Temperature in 2 Columns */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Duration (hrs)</span>
                  <span className="font-mono font-bold text-purple-300 text-xs">{stormDuration}h</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={stormDuration}
                  onChange={(e) => {
                    setStormDuration(parseInt(e.target.value));
                    setIsRebalanced(false);
                  }}
                  className="et-range"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Temp (°C)</span>
                  <span className={`font-mono font-bold text-xs ${temperature > 38 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {temperature}°C
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={45}
                  step={1}
                  value={temperature}
                  onChange={(e) => {
                    setTemperature(parseInt(e.target.value));
                    setIsRebalanced(false);
                  }}
                  className="et-range"
                />
              </div>
            </div>

            {/* Transit & Venue Ingress Delays */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Transit Drop</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">-{transitReductionPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={transitReductionPct}
                  onChange={(e) => {
                    setTransitReductionPct(parseInt(e.target.value));
                    setIsRebalanced(false);
                  }}
                  className="et-range"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Gate Delay</span>
                  <span className="font-mono font-bold text-rose-300 text-xs">+{venueDelayMinutes}m</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={venueDelayMinutes}
                  onChange={(e) => {
                    setVenueDelayMinutes(parseInt(e.target.value));
                    setIsRebalanced(false);
                  }}
                  className="et-range"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="et-btn et-btn-primary w-full py-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>RUN SIMULATION</span>
          </button>
        </GlassCard>

        {/* Simulation Output & Dynamic Rebalancing (Col 7) */}
        <GlassCard className="lg:col-span-7 flex flex-col justify-between gap-5" variant="elevated">
          <div>
            <SectionHeader
              title="Before / After Comparison"
              subtitle="Current state vs simulated scenario output"
              color="cyan"
              className="border-b border-white/8 pb-3 mb-4"
              right={
                <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/25">
                  DYNAMIC ENGINE
                </span>
              }
            />

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              {/* CURRENT STATE */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs">
                <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                  CURRENT STATE
                </span>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>City Stress</span>
                      <AnimatedStat value={before.cityStress} suffix="%" className="text-rose-400 font-bold" />
                    </div>
                    <LoadBar pct={before.cityStress} className="mt-1" height="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Transit Load</span>
                      <AnimatedStat value={before.transitLoad} suffix="%" className="text-white font-bold" />
                    </div>
                    <LoadBar pct={before.transitLoad} className="mt-1" height="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Parking Load</span>
                      <AnimatedStat value={before.parkingLoad} suffix="%" className="text-white font-bold" />
                    </div>
                    <LoadBar pct={before.parkingLoad} className="mt-1" height="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Venue Load</span>
                      <AnimatedStat value={before.venueLoad} suffix="%" className="text-white font-bold" />
                    </div>
                    <LoadBar pct={before.venueLoad} className="mt-1" height="h-1.5" />
                  </div>
                </div>
              </div>

              {/* SIMULATED SCENARIO */}
              <div
                className={`p-4 rounded-xl border flex flex-col gap-2.5 text-xs transition-all ${
                  isRebalanced
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold font-mono uppercase tracking-wider ${
                      isRebalanced ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isRebalanced ? 'REBALANCED' : 'SIMULATED SCENARIO'}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isRebalanced ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isRebalanced ? 'OPTIMIZED' : after.cityStress > 85 ? 'CRITICAL' : 'ELEVATED'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>City Stress</span>
                      <AnimatedStat
                        value={after.cityStress}
                        suffix="%"
                        className={`text-sm font-black ${isRebalanced ? 'text-emerald-400' : 'text-rose-400'}`}
                      />
                    </div>
                    <LoadBar pct={after.cityStress} className="mt-1" height="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Transit Load</span>
                      <AnimatedStat
                        value={after.transitLoad}
                        suffix="%"
                        className={after.transitLoad > 100 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}
                      />
                    </div>
                    <LoadBar pct={after.transitLoad} className="mt-1" height="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Parking Load</span>
                      <AnimatedStat
                        value={after.parkingLoad}
                        suffix="%"
                        className={after.parkingLoad > 90 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}
                      />
                    </div>
                    <LoadBar pct={after.parkingLoad} className="mt-1" height="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Venue Load</span>
                      <AnimatedStat
                        value={after.venueLoad}
                        suffix="%"
                        className={after.venueLoad > 100 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}
                      />
                    </div>
                    <LoadBar pct={after.venueLoad} className="mt-1" height="h-1.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* CASCADING HOSPITALITY & TRAVEL IMPACT (Midnight Task Requirement) */}
            {rippleEffects?.hospitality && (
              <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-slate-900/70 to-purple-950/40 rounded-xl border border-indigo-500/40 text-xs mb-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                    🏨 HOSPITALITY & TRAVEL CASCADING IMPACT
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Cascading Ripple
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Zone A Hotel Surge:</span>
                    <strong className="text-amber-400 font-bold text-xs">+{rippleEffects.hospitality.coreHotelsOccupancyShiftPct}%</strong>
                    <span className="text-[9px] text-slate-500 block">Stranded guests shelter</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Stranded Delegates:</span>
                    <strong className="text-rose-400 font-bold text-xs">{rippleEffects.hospitality.strandedTravelersEst.toLocaleString()}</strong>
                    <span className="text-[9px] text-slate-500 block">Seeking emergency rooms</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Indoor Dining:</span>
                    <strong className="text-emerald-400 font-bold text-xs">+{rippleEffects.hospitality.restaurantIndoorSurgePct}%</strong>
                    <span className="text-[9px] text-slate-500 block">Outdoor stalls: -{rippleEffects.hospitality.restaurantOutdoorDropPct}%</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Workforce Availability:</span>
                    <strong className={rippleEffects.hospitality.workforceAvailabilityPct < 70 ? 'text-rose-400' : 'text-slate-200'}>
                      {rippleEffects.hospitality.workforceAvailabilityPct}%
                    </strong>
                    <span className="text-[9px] text-slate-500 block">Commuter delay: +{rippleEffects.hospitality.commuterDelayMinutes}m</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Dewatering Pumps:</span>
                    <strong className="text-cyan-400 font-bold text-xs">{rippleEffects.hospitality.dewateringPumpsActive} Active</strong>
                    <span className="text-[9px] text-slate-500 block">Low-lying Kurla swale</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Ponchos Deployed:</span>
                    <strong className="text-purple-300 font-bold text-xs">{rippleEffects.hospitality.emergencyPonchosDeployed.toLocaleString()}</strong>
                    <span className="text-[9px] text-slate-500 block">Gate shelter stock</span>
                  </div>
                </div>
              </div>
            )}

            {/* Probabilistic AI Uncertainty (Midnight Task Requirement) */}
            {simData.probabilisticUncertainty && (
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-slate-300 font-bold">Probabilistic 95% Confidence Interval:</span>
                    <span className="text-cyan-300 font-mono ml-2 font-bold">
                      [{simData.probabilisticUncertainty.confidenceInterval[0]}% – {simData.probabilisticUncertainty.confidenceInterval[1]}%]
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      (SE: ±{simData.probabilisticUncertainty.standardError}%, {simData.probabilisticUncertainty.riskVariance})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{simData.probabilisticUncertainty.modelReliability}</span>
              </div>
            )}

            {/* AI RECOMMENDATION BOX */}
            <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/40 flex flex-col gap-2 mb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                EXPLAINABLE RECOMMENDATION:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                "{explainability.action}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-cyan-400 font-bold block">WHY?</span>
                  <span className="text-slate-300">{explainability.why}</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">EXPECTED EFFECT?</span>
                  <span className="text-slate-300">{explainability.expectedEffect}</span>
                </div>
                <div>
                  <span className="text-amber-300 font-bold block">TRADE-OFF?</span>
                  <span className="text-slate-300">{explainability.tradeOff}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC REBALANCING BUTTON */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span>Zone A: <b className={(after.zoneALoad || 110) > 100 ? "text-rose-400" : "text-amber-400"}>{after.zoneALoad || 110}% LOAD</b></span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span>Zone C: <b className="text-emerald-400">{after.zoneCLoad || 50}% BUFFER</b></span>
            </div>

            <button
              type="button"
              onClick={handleSimulateRebalancing}
              disabled={isSimulating}
              className={`w-full py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 ${
                isRebalanced
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/20'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>
                {isSimulating
                  ? 'CALCULATING REBALANCING...'
                  : isRebalanced
                  ? `SIMULATED INTERVENTION ACTIVE (STRESS DROPPED TO ${after.cityStress}%)`
                  : 'SIMULATE REBALANCING'}
              </span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* NUGEN INTELLIGENCE COPILOT (TASK 2 MANDATORY TECHNOLOGY) */}
      <div data-tutorial="nugen-copilot">
        <NugenCopilot
        currentMetrics={{
          cityStress: after.cityStress,
          venueLoad: after.venueLoad,
          transitLoad: after.transitLoad,
          parkingLoad: after.parkingLoad,
          hotelOccupancy: after.hotelOccupancy
        }}
        currentWeather={{
          rainfallIntensity,
          stormDuration,
          temperature,
          floodingSeverity
        }}
        currentScenario={{
          visitorIncreasePct,
          transitReductionPct,
          parkingReductionPct,
          shuttleReductionPct,
          venueDelayMinutes
        }}
      />
      </div>
    </div>
  );
};
