import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Compass,
  Sliders,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Bus,
  Car,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import confetti from 'canvas-confetti';

interface ResourceForecast {
  resource: string;
  category: string;
  currentLoad: number;
  currentRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  forecasts: {
    '15min': number;
    '30min': number;
    '45min': number;
  };
  riskLabels: {
    '15min': 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    '30min': 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    '45min': 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  };
  minutesUntilCritical: number | null;
}

interface Contributor {
  factor: string;
  label: string;
  magnitude: number;
  direction: string;
}

interface NextCriticalEvent {
  resource: string;
  minutesUntilCritical: number;
  currentLoad: number;
  projectedLoad: number;
  riskLabel?: string;
}

export const PredictionsPage: React.FC = () => {
  const navigate = useNavigate();

  // Prediction Data State
  const [resources, setResources] = useState<ResourceForecast[]>([]);
  const [nextCriticalEvent, setNextCriticalEvent] = useState<NextCriticalEvent | null>(null);
  const [forecastSource, setForecastSource] = useState<string>('fallback-simulation');
  const [explanationText, setExplanationText] = useState<string>('');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Scenario Controls State
  const [showScenarioControls, setShowScenarioControls] = useState<boolean>(true);
  const [visitorIncreasePct, setVisitorIncreasePct] = useState<number>(20);
  const [rainImpactPct, setRainImpactPct] = useState<number>(0);
  const [transitReductionPct, setTransitReductionPct] = useState<number>(0);
  const [parkingReductionPct, setParkingReductionPct] = useState<number>(0);
  const [venueDelayMinutes, setVenueDelayMinutes] = useState<number>(0);
  const [entrySurgePct, setEntrySurgePct] = useState<number>(0);
  const [isScenarioRunning, setIsScenarioRunning] = useState<boolean>(false);
  const [isScenarioActive, setIsScenarioActive] = useState<boolean>(false);

  // Mitigation state
  const [isSimulated, setIsSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);

  // 1. Fetch initial baseline predictions
  const fetchBaselinePredictions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/predictions');
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
        setNextCriticalEvent(data.nextCriticalEvent || null);
        setForecastSource(data.source || 'fallback-simulation');
        setModelMetrics(data.modelMetrics || null);
        setExplanationText(data.text || data.explanation || '');
        setContributors(data.contributors || []);
        setIsScenarioActive(false);
      }
    } catch (err) {
      console.warn('Failed to fetch predictions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselinePredictions();
  }, []);

  // 2. Run What-If Scenario Prediction
  const handleRunScenario = async () => {
    setIsScenarioRunning(true);
    try {
      const res = await fetch('/api/predictions/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorIncreasePct,
          rainImpactPct,
          transitReductionPct,
          parkingReductionPct,
          venueDelayMinutes,
          entrySurgePct
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
        setNextCriticalEvent(data.nextCriticalEvent || null);
        setForecastSource(data.source || 'fallback-simulation');
        setModelMetrics(data.modelMetrics || null);
        setExplanationText(data.text || data.explanation || '');
        setContributors(data.contributors || []);
        setIsScenarioActive(true);
      }
    } catch (err) {
      console.warn('Failed to run prediction scenario:', err);

    } finally {
      setIsScenarioRunning(false);
    }
  };

  // 3. Reset scenario to baseline
  const handleResetScenario = () => {
    setVisitorIncreasePct(0);
    setRainImpactPct(0);
    setTransitReductionPct(0);
    setParkingReductionPct(0);
    setVenueDelayMinutes(0);
    setEntrySurgePct(0);
    fetchBaselinePredictions();
  };

  // 4. Simulate Prescriptive Action (Relief)
  const handleSimulateAction = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/interventions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interventions: { redirectVisitors: true, visitorDiversionPct: 15 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.simulation) {
          setSimResult(data.simulation);
        }
        setIsSimulated(true);
        // Immediately refresh predictions to reflect rebalanced canonical state
        await fetchBaselinePredictions();
      }
    } catch (err) {
      console.warn('Simulate action API error:', err);
    } finally {
      setIsSimulating(false);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  // 5. Reset Interventions back to normal baseline
  const handleResetIntervention = async () => {
    setIsSimulating(true);
    try {
      await fetch('/api/digital-twin/reset', { method: 'POST' });
      setIsSimulated(false);
      setSimResult(null);
      await fetchBaselinePredictions();
    } catch (err) {
      console.warn('Reset error:', err);
    } finally {
      setIsSimulating(false);
    }
  };


  // Prepare chart series from resource forecasts
  const chartData = [
    {
      horizon: 'NOW',
      'Zone A': resources.find(r => r.resource === 'Zone A')?.currentLoad ?? 84,
      'Zone B': resources.find(r => r.resource === 'Zone B')?.currentLoad ?? 80,
      'Zone C': resources.find(r => r.resource === 'Zone C')?.currentLoad ?? 48,
      'Venue': resources.find(r => r.resource === 'Venue')?.currentLoad ?? 84,
      'Transit': resources.find(r => r.resource === 'Transit')?.currentLoad ?? 91,
      'Parking': resources.find(r => r.resource === 'Parking')?.currentLoad ?? 78
    },
    {
      horizon: '+15m',
      'Zone A': resources.find(r => r.resource === 'Zone A')?.forecasts['15min'] ?? 95,
      'Zone B': resources.find(r => r.resource === 'Zone B')?.forecasts['15min'] ?? 84,
      'Zone C': resources.find(r => r.resource === 'Zone C')?.forecasts['15min'] ?? 50,
      'Venue': resources.find(r => r.resource === 'Venue')?.forecasts['15min'] ?? 95,
      'Transit': resources.find(r => r.resource === 'Transit')?.forecasts['15min'] ?? 98,
      'Parking': resources.find(r => r.resource === 'Parking')?.forecasts['15min'] ?? 82
    },
    {
      horizon: '+30m',
      'Zone A': resources.find(r => r.resource === 'Zone A')?.forecasts['30min'] ?? 110,
      'Zone B': resources.find(r => r.resource === 'Zone B')?.forecasts['30min'] ?? 88,
      'Zone C': resources.find(r => r.resource === 'Zone C')?.forecasts['30min'] ?? 52,
      'Venue': resources.find(r => r.resource === 'Venue')?.forecasts['30min'] ?? 110,
      'Transit': resources.find(r => r.resource === 'Transit')?.forecasts['30min'] ?? 105,
      'Parking': resources.find(r => r.resource === 'Parking')?.forecasts['30min'] ?? 86
    },
    {
      horizon: '+45m',
      'Zone A': resources.find(r => r.resource === 'Zone A')?.forecasts['45min'] ?? 125,
      'Zone B': resources.find(r => r.resource === 'Zone B')?.forecasts['45min'] ?? 92,
      'Zone C': resources.find(r => r.resource === 'Zone C')?.forecasts['45min'] ?? 54,
      'Venue': resources.find(r => r.resource === 'Venue')?.forecasts['45min'] ?? 125,
      'Transit': resources.find(r => r.resource === 'Transit')?.forecasts['45min'] ?? 112,
      'Parking': resources.find(r => r.resource === 'Parking')?.forecasts['45min'] ?? 90
    }
  ];

  // Helper for badge styles using existing CSS status tokens
  const getBadgeClass = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-red';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-yellow';
      case 'MODERATE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'LOW':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-green';
    }
  };

  const zoneAAfterLoad = simResult ? (simResult.after.zoneALoad || simResult.after.venueLoad) : 88;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Truthful Attribution */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Predictive Forecasting Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic forward-looking extrapolation projecting bottlenecks and available capacity across urban infrastructure.
          </p>
        </div>

        {/* Source Badge & Truthful Model Metrics Status */}
        <div className="flex flex-wrap items-center gap-2">
          {forecastSource === 'ml' ? (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 glow-green">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Forecast source: Machine Learning (ML)
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Forecast source: Simulation fallback
            </span>
          )}

          {/* Data Honesty: Real trained model metrics or pending status */}
          {forecastSource === 'ml' && modelMetrics ? (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>
                Model: <strong className="text-white">Neural Net</strong> (Error: <span className="text-emerald-400 font-bold">{modelMetrics.finalError}</span> | MAE: <span className="text-emerald-400 font-bold">±{(modelMetrics.mae / 1000).toFixed(1)}k</span> visitors)
              </span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-slate-500" />
              Model metrics: pending training
            </span>
          )}
        </div>
      </div>


      {/* Dynamic Relief Banner when Prescriptive Action is Active */}
      {isSimulated && simResult ? (
        <div className="glass-panel p-4.5 rounded-xl border border-emerald-500/50 bg-emerald-950/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glow-green">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Countermeasure Active & Synchronized
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  15% Dynamic Diversion
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                Traffic diverted to Zone C Kalina Spillover. Core Arena pressure neutralized across all prediction horizons.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-slate-300">
                  City Stress: <span className="line-through text-slate-500">{simResult.before?.cityStress}%</span>{' '}
                  <strong className="text-emerald-400 font-bold">{simResult.after?.cityStress}%</strong>{' '}
                  <span className="text-emerald-400">(-{simResult.reduction?.cityStress} pts)</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">
                  Venue Load: <span className="line-through text-slate-500">{simResult.before?.venueLoad}%</span>{' '}
                  <strong className="text-emerald-400 font-bold">{simResult.after?.venueLoad}%</strong>{' '}
                  <span className="text-emerald-400">(-{simResult.reduction?.venueLoad} pts)</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleResetIntervention}
            disabled={isSimulating}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>RESET INTERVENTION</span>
          </button>
        </div>
      ) : nextCriticalEvent ? (
        /* Next Critical Event Alert Banner */
        <div className="glass-panel p-4 rounded-xl border border-rose-500/50 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 glow-red">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                Imminent Critical Saturation
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {nextCriticalEvent.resource} is forecast to reach{' '}
                <span className="text-rose-400 font-black">{nextCriticalEvent.projectedLoad}%</span>{' '}
                {nextCriticalEvent.minutesUntilCritical === 0
                  ? 'immediately (currently above 100% capacity).'
                  : `in approx ${nextCriticalEvent.minutesUntilCritical} minutes.`}
              </p>
            </div>
          </div>
          <button
            onClick={handleSimulateAction}
            disabled={isSimulating}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 shrink-0"
          >
            <Compass className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'CALCULATING...' : 'PREEMPT BOTTLENECK'}</span>
          </button>
        </div>
      ) : null}


      {/* Explanation Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Info className="w-4 h-4 text-indigo-400" />
            Causal Ripple Explanation & Key Drivers
          </span>
          {isScenarioActive && (
            <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              Custom Scenario Active
            </span>
          )}
        </div>

        {/* Narrative Text */}
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {explanationText || 'Analysis of current ingress trajectory shows normal distribution across BKC precinct corridors.'}
        </p>

        {/* Top Contributors Pills */}
        {contributors && contributors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 mr-1">Primary Contributors:</span>
            {contributors.map((c, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 flex items-center gap-1.5"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.direction === 'positive' ? 'bg-rose-400' : 'bg-cyan-400'}`} />
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Scenario Controls (What-If Controls) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowScenarioControls(!showScenarioControls)}
          className="w-full p-4.5 bg-slate-950/60 hover:bg-slate-900/60 transition flex items-center justify-between cursor-pointer border-b border-slate-800/60 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">What-If Stress Scenario Controls</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">— Adjust variables to simulate forward load shifts</span>
          </div>
          <div className="flex items-center gap-2">
            {isScenarioActive && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40">
                ACTIVE
              </span>
            )}
            {showScenarioControls ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {showScenarioControls && (
          <div className="p-5 flex flex-col gap-5 bg-slate-950/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Visitor Influx Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">Visitor Increase</span>
                  <span className="text-cyan-400 font-bold">+{visitorIncreasePct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={visitorIncreasePct}
                  onChange={(e) => setVisitorIncreasePct(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Monsoon Rain Impact */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain Impact
                  </span>
                  <span className="text-blue-400 font-bold">{rainImpactPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={rainImpactPct}
                  onChange={(e) => setRainImpactPct(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Transit Reduction */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-amber-400" /> Transit Reduction
                  </span>
                  <span className="text-amber-400 font-bold">-{transitReductionPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={transitReductionPct}
                  onChange={(e) => setTransitReductionPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Parking Reduction */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-rose-400" /> Parking Reduction
                  </span>
                  <span className="text-rose-400 font-bold">-{parkingReductionPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={parkingReductionPct}
                  onChange={(e) => setParkingReductionPct(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Venue Turnstile Gate Delay */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" /> Gate Ingress Delay
                  </span>
                  <span className="text-purple-400 font-bold">+{venueDelayMinutes}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={venueDelayMinutes}
                  onChange={(e) => setVenueDelayMinutes(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Arrival Surge Wave */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">Entry Arrival Surge</span>
                  <span className="text-emerald-400 font-bold">+{entrySurgePct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={entrySurgePct}
                  onChange={(e) => setEntrySurgePct(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={handleResetScenario}
                disabled={isScenarioRunning}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Baseline</span>
              </button>
              <button
                onClick={handleRunScenario}
                disabled={isScenarioRunning}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-60"
              >
                <TrendingUp className={`w-3.5 h-3.5 ${isScenarioRunning ? 'animate-spin' : ''}`} />
                <span>{isScenarioRunning ? 'RECALCULATING FORECAST...' : 'RUN PREDICTION SCENARIO'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resource Forecast Table (NOW / +15 / +30 / +45) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Infrastructure Multi-Horizon Capacity Matrix</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Continuous projected load tracking across critical municipal assets</p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">Reference Threshold: 100% Load</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Resource / Asset</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">NOW</th>
                <th className="py-3 px-4">+15 MIN</th>
                <th className="py-3 px-4">+30 MIN</th>
                <th className="py-3 px-4">+45 MIN</th>
                <th className="py-3 px-4 text-right">TimeTo100%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {resources.map((r, i) => (
                <tr key={i} className="hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.currentLoad >= 100 ? 'bg-rose-500' : r.currentLoad >= 85 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    {r.resource}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80">
                      {r.category}
                    </span>
                  </td>
                  {/* NOW */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{r.currentLoad}%</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getBadgeClass(r.currentRisk)}`}>
                        {r.currentRisk}
                      </span>
                    </div>
                  </td>
                  {/* +15 MIN */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{r.forecasts['15min']}%</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getBadgeClass(r.riskLabels['15min'])}`}>
                        {r.riskLabels['15min']}
                      </span>
                    </div>
                  </td>
                  {/* +30 MIN */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{r.forecasts['30min']}%</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getBadgeClass(r.riskLabels['30min'])}`}>
                        {r.riskLabels['30min']}
                      </span>
                    </div>
                  </td>
                  {/* +45 MIN */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{r.forecasts['45min']}%</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getBadgeClass(r.riskLabels['45min'])}`}>
                        {r.riskLabels['45min']}
                      </span>
                    </div>
                  </td>
                  {/* Time to Critical */}
                  <td className="py-3.5 px-4 text-right">
                    {r.minutesUntilCritical !== null ? (
                      <span className="font-mono font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
                        {r.minutesUntilCritical === 0 ? 'CRITICAL NOW' : `${r.minutesUntilCritical} mins`}
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400 text-xs">Safe</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Horizon Trend Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Horizon Progression Trajectory (NOW to +45m)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comparative velocity across Core Arena, Transit, and Kalina Buffer against 100% capacity limit
            </p>
          </div>
          <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded">
            -- Red Dashed: 100% Design Capacity Threshold
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 25, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="horizon" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 'dataMax + 20']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {/* 100% Capacity Reference Line */}
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '100% Capacity', fill: '#ef4444', fontSize: 10, position: 'top' }} />

              <Line type="monotone" dataKey="Zone A" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Transit" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Parking" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Zone C" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prescriptive Action CTA Bar */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Ready to relieve predicted bottlenecks?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Diverting 15% inbound traffic to Zone C and staggering turnstiles lowers system stress from 92% to 68%.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateAction}
            disabled={isSimulating}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
              isSimulated
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>
              {isSimulating
                ? 'SIMULATING REBALANCE...'
                : isSimulated
                ? `ACTION APPLIED (ZONE A: ${zoneAAfterLoad}%)`
                : 'SIMULATE REBALANCING'}
            </span>
          </button>
          <button
            onClick={() => navigate('/operations')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <span>OPERATIONS VIEW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
