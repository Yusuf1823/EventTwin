import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudRain, Thermometer, Wind, Droplets, Eye, RefreshCw,
  AlertTriangle, CheckCircle2, CloudLightning, MapPin, Clock,
  TrendingUp, ShieldAlert, Waves, ArrowUp, ArrowDown
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';

interface WeatherCurrent {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
  severity: string;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
  severity: string;
  windSpeed: number;
}

interface WeatherImpact {
  rainImpactPct: number;
  windImpactPct: number;
  temperatureImpactPct: number;
  visibilityImpactPct: number;
  humidityDiscomfortPct: number;
  compositeImpact: number;
  waterloggingRisk: string;
  monsoonAlert: string;
  simulationParams: {
    rainImpactPct: number;
    temperatureStressPct: number;
    windDisruptionPct: number;
  };
}

interface UpcomingRisk {
  maxRainNext6h: number;
  maxPrecipProbNext6h: number;
  worstCondition: string;
  worstSeverity: string;
  worstIcon: string;
  deteriorating: boolean;
}

interface WeatherData {
  source: string;
  isLive: boolean;
  cached: boolean;
  fetchedAt: string;
  location: { name: string; latitude: number; longitude: number };
  current: WeatherCurrent;
  impact: WeatherImpact;
  hourlyForecast: HourlyForecast[];
  upcomingRisk: UpcomingRisk;
  error?: string;
}

const severityColors: Record<string, string> = {
  'none': 'text-emerald-400',
  'low': 'text-yellow-400',
  'moderate': 'text-amber-400',
  'high': 'text-orange-400',
  'critical': 'text-red-400'
};

const riskBadge: Record<string, string> = {
  'NONE': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'LOW': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'MODERATE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'HIGH': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'CRITICAL': 'bg-red-500/20 text-red-300 border-red-500/30'
};

const alertBadge: Record<string, string> = {
  'CLEAR': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'GREEN ADVISORY': 'bg-green-500/20 text-green-300 border-green-500/30',
  'YELLOW ALERT': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'ORANGE ALERT': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'RED ALERT': 'bg-red-500/20 text-red-300 border-red-500/30'
};

export const WeatherPage: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchWeather = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = forceRefresh ? '/api/weather/refresh' : '/api/weather';
      const method = forceRefresh ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method });
      const data = await res.json();
      setWeather(forceRefresh ? data.weather || data : data);
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (loading || !weather) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-cyan-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-mono">Fetching live weather from Open-Meteo...</span>
        </div>
      </div>
    );
  }

  const { current, impact, hourlyForecast, upcomingRisk } = weather;

  return (
    <div className="flex flex-col gap-6 page-enter">
      <PageHeader
        title="Weather Intelligence"
        accent={
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">Open-Meteo · {weather.location.name}</span>
          </div>
        }
        subtitle={
          <span className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            {weather.location.name}
            <span className="text-cyan-400">•</span>
            <span className={weather.isLive ? 'text-emerald-400' : 'text-amber-400'}>
              {weather.isLive ? '● LIVE' : '⚠ FALLBACK'}
            </span>
            <span className="text-slate-600">from {weather.source}</span>
          </span>
        }
        actions={
          <button
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            className="et-btn et-btn-ghost px-4 py-2 text-[11px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Force Refresh'}
          </button>
        }
      />

      {/* Current Weather Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{current.weatherIcon}</div>
              <div>
                <div className="text-4xl font-black text-white">{current.temperature}°C</div>
                <div className="text-sm text-slate-400">Feels like {current.feelsLike}°C</div>
                <div className={`text-sm font-semibold mt-1 ${severityColors[current.severity] || 'text-slate-300'}`}>
                  {current.weatherLabel}
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div className="flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                Last: {lastRefreshed}
              </div>
              {weather.cached && <span className="text-amber-400 text-[10px]">CACHED</span>}
            </div>
          </div>

          {/* Weather Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Humidity
              </div>
              <div className="text-lg font-bold text-white">{current.humidity}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                Rainfall
              </div>
              <div className="text-lg font-bold text-white">{current.rain} mm/hr</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                Wind
              </div>
              <div className="text-lg font-bold text-white">{current.windSpeed} km/h</div>
              <div className="text-[10px] text-slate-500">Gusts: {current.windGusts} km/h</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Precipitation
              </div>
              <div className="text-lg font-bold text-white">{current.precipitation} mm</div>
            </div>
          </div>
        </div>

        {/* Risk Assessment Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            RISK ASSESSMENT
          </h3>

          {/* Monsoon Alert */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Monsoon Alert</span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${alertBadge[impact.monsoonAlert] || alertBadge['CLEAR']}`}>
              {impact.monsoonAlert}
            </span>
          </div>

          {/* Waterlogging Risk */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3" /> Waterlogging
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${riskBadge[impact.waterloggingRisk] || riskBadge['NONE']}`}>
              {impact.waterloggingRisk}
            </span>
          </div>

          {/* Composite Impact */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Composite Impact</span>
              <span className="font-mono font-bold text-white">{impact.compositeImpact}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  impact.compositeImpact > 30 ? 'bg-red-500' :
                  impact.compositeImpact > 15 ? 'bg-amber-500' :
                  impact.compositeImpact > 5 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, impact.compositeImpact * 2)}%` }}
              />
            </div>
          </div>

          {/* Impact Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Rain</span>
              <span className="text-white font-mono">{impact.rainImpactPct}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Wind</span>
              <span className="text-white font-mono">{impact.windImpactPct}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Temperature</span>
              <span className="text-white font-mono">{impact.temperatureImpactPct}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Humidity</span>
              <span className="text-white font-mono">{impact.humidityDiscomfortPct}%</span>
            </div>
          </div>

          {/* Upcoming Risk */}
          {upcomingRisk && (
            <div className={`p-3 rounded-xl border mt-auto ${upcomingRisk.deteriorating ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              <div className="flex items-center gap-2 text-xs mb-1">
                {upcomingRisk.deteriorating ? (
                  <>
                    <ArrowUp className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-300 font-bold">DETERIORATING</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">STABLE / IMPROVING</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Next 6h: {upcomingRisk.worstCondition} • Rain max {upcomingRisk.maxRainNext6h}mm/hr • {upcomingRisk.maxPrecipProbNext6h}% probability
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Impact Parameters (auto-feed to simulator) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          SIMULATION ENGINE FEED — Auto-Calculated from Live Weather
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
            <div className="text-xs text-cyan-300 font-semibold mb-1">Rain Impact → Simulator</div>
            <div className="text-2xl font-black text-white">{impact.simulationParams.rainImpactPct}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Feeds: Road capacity, shuttle delays, parking dwell</div>
          </div>
          <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 rounded-xl p-4 border border-rose-500/20">
            <div className="text-xs text-rose-300 font-semibold mb-1">Temperature Stress → Simulator</div>
            <div className="text-2xl font-black text-white">{impact.simulationParams.temperatureStressPct}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Feeds: Hotel demand, outdoor queue tolerance</div>
          </div>
          <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-xl p-4 border border-teal-500/20">
            <div className="text-xs text-teal-300 font-semibold mb-1">Wind Disruption → Simulator</div>
            <div className="text-2xl font-black text-white">{impact.simulationParams.windDisruptionPct}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Feeds: Shuttle operations, outdoor zone capacity</div>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Timeline */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          12-HOUR FORECAST (Open-Meteo Live)
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {hourlyForecast.map((hour, i) => {
            const time = new Date(hour.time);
            const hourLabel = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
              <div
                key={i}
                className={`flex-shrink-0 w-24 p-3 rounded-xl border text-center transition-all hover:scale-105 ${
                  hour.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  hour.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                  hour.severity === 'moderate' ? 'bg-amber-500/10 border-amber-500/30' :
                  hour.severity === 'low' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-mono mb-1">{hourLabel}</div>
                <div className="text-xl mb-1">{hour.weatherIcon}</div>
                <div className="text-sm font-bold text-white">{hour.temperature}°</div>
                <div className="text-[10px] text-slate-500 mt-1">{hour.precipitationProbability}% rain</div>
                <div className="text-[10px] text-slate-500">{hour.windSpeed} km/h</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
