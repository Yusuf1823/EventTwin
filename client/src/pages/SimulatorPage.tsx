import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, ArrowRight, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, CloudRain, Clock, Bus, Car } from 'lucide-react';
import confetti from 'canvas-confetti';

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
      roadCapacityDropPct: number;
      shuttleTravelTimeMinutes: number;
      arrivalConcentrationSurgePct: number;
      parkingDwellSurgePct: number;
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
  const [venueDelayMinutes, setVenueDelayMinutes] = useState(0);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isRebalanced, setIsRebalanced] = useState(false);
  const [simData, setSimData] = useState<SimulationState>(DEFAULT_SIM_DATA);

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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">WHAT-IF SIMULATOR</h1>
        <p className="text-xs text-slate-400 mt-0.5">What happens if the situation changes?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Scenario Controls (Col 5) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">SCENARIO CONTROLS</h2>
            </div>

            {/* Control 1: Visitor Increase */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
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
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Control 2: Transit Reduction */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">Transit Reduction (0–50%)</span>
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
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Control 3: Parking Reduction */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">Parking Reduction (0–50%)</span>
                <span className="font-mono font-bold text-amber-300 text-xs">-{parkingReductionPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={parkingReductionPct}
                onChange={(e) => {
                  setParkingReductionPct(parseInt(e.target.value));
                  setIsRebalanced(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Control 4: Shuttle Reduction */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">Shuttle Fleet Reduction (0–50%)</span>
                <span className="font-mono font-bold text-amber-300 text-xs">-{shuttleReductionPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={shuttleReductionPct}
                onChange={(e) => {
                  setShuttleReductionPct(parseInt(e.target.value));
                  setIsRebalanced(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Control 5: Rain Impact */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain Impact (0–50%)
                </span>
                <span className="font-mono font-bold text-blue-300 text-xs">+{rainImpactPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={rainImpactPct}
                onChange={(e) => {
                  setRainImpactPct(parseInt(e.target.value));
                  setIsRebalanced(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            {/* Control 6: Venue Delay */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" /> Venue Ingress Delay (0–60m)
                </span>
                <span className="font-mono font-bold text-purple-300 text-xs">+{venueDelayMinutes} mins</span>
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
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>RUN SIMULATION</span>
          </button>
        </div>

        {/* Simulation Output & Dynamic Rebalancing (Col 7) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  BEFORE / AFTER COMPARISON
                </h2>
                <p className="text-[11px] text-slate-400">Current State vs Simulated Scenario</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] font-bold border border-slate-700">
                DYNAMIC ENGINE CALCULATION
              </span>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
              {/* CURRENT STATE */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs">
                <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                  CURRENT STATE
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">City Stress:</span>
                    <strong className="text-rose-400">{before.cityStress}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transit Load:</span>
                    <strong className="text-white">{before.transitLoad}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parking Load:</span>
                    <strong className="text-white">{before.parkingLoad}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Venue Load:</span>
                    <strong className="text-white">{before.venueLoad}%</strong>
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

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">City Stress:</span>
                    <strong
                      className={`text-sm font-black ${
                        isRebalanced ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {after.cityStress}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transit Load:</span>
                    <strong className={after.transitLoad > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                      {after.transitLoad}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parking Load:</span>
                    <strong className={after.parkingLoad > 90 ? 'text-rose-400' : 'text-emerald-400'}>
                      {after.parkingLoad}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Venue Load:</span>
                    <strong className={after.venueLoad > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                      {after.venueLoad}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Ripple Effects Chain (when rain or transit or delay active) */}
            {rippleEffects && (rainImpactPct > 0 || transitReductionPct > 0 || venueDelayMinutes > 0) && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] mb-3 space-y-1">
                <span className="text-amber-400 font-bold block">OBSERVED RIPPLE EFFECTS:</span>
                <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px]">
                  {rainImpactPct > 0 && (
                    <span>• Road Capacity: -{rippleEffects.rain?.roadCapacityDropPct}% (Shuttle: {rippleEffects.rain?.shuttleTravelTimeMinutes}m)</span>
                  )}
                  {transitReductionPct > 0 && (
                    <span>• Road Spillover: +{rippleEffects.transitSpillover?.spilloverToRoadPct}%</span>
                  )}
                  {venueDelayMinutes > 0 && (
                    <span>• Turnstile Throughput: -{100 - (rippleEffects.venueGate?.effectiveCapacityPct || 100)}%</span>
                  )}
                </div>
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
        </div>
      </div>
    </div>
  );
};
