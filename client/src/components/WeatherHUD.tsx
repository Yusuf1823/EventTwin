import React, { useState, useEffect } from 'react';
import { CloudRain, Thermometer, Wind, Droplets, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface WeatherHUDData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    rain: number;
    weatherLabel: string;
    weatherIcon: string;
    severity: string;
    windSpeed: number;
  };
  impact: {
    compositeImpact: number;
    waterloggingRisk: string;
    monsoonAlert: string;
    rainImpactPct: number;
    simulationParams: {
      rainImpactPct: number;
      temperatureStressPct: number;
      windDisruptionPct: number;
    };
  };
  upcomingRisk: {
    deteriorating: boolean;
    worstCondition: string;
    maxRainNext6h: number;
    maxPrecipProbNext6h: number;
  };
  isLive: boolean;
  source: string;
}

export const WeatherHUD: React.FC = () => {
  const [weather, setWeather] = useState<WeatherHUDData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather');
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error('WeatherHUD: Failed to fetch', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) {
    return (
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md rounded-xl px-3 py-2 border border-slate-700/50 flex items-center gap-2">
        <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
        <span className="text-[10px] text-slate-400">Weather...</span>
      </div>
    );
  }

  const { current, impact, upcomingRisk } = weather;

  const severityGlow = impact.compositeImpact > 30 ? 'border-red-500/40 shadow-red-500/10' :
    impact.compositeImpact > 15 ? 'border-amber-500/40 shadow-amber-500/10' :
    impact.compositeImpact > 5 ? 'border-yellow-500/40 shadow-yellow-500/10' :
    'border-emerald-500/40 shadow-emerald-500/10';

  return (
    <div
      className={`absolute top-3 right-3 z-20 bg-slate-900/95 backdrop-blur-md rounded-xl border shadow-lg transition-all duration-300 ${severityGlow} ${expanded ? 'w-64' : 'w-auto'}`}
    >
      {/* Compact View */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 w-full cursor-pointer"
      >
        <span className="text-lg">{current.weatherIcon}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{current.temperature}°</span>
          <span className="text-[10px] text-slate-400">{current.weatherLabel}</span>
        </div>
        {current.rain > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
            {current.rain}mm
          </span>
        )}
        {impact.monsoonAlert !== 'CLEAR' && (
          <AlertTriangle className="w-3 h-3 text-amber-400" />
        )}
        {expanded ? <ChevronUp className="w-3 h-3 text-slate-400 ml-auto" /> : <ChevronDown className="w-3 h-3 text-slate-400 ml-auto" />}
      </button>

      {/* Expanded View */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-700/50 pt-2">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold ${weather.isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {weather.isLive ? '● LIVE' : '⚠ OFFLINE'}
            </span>
            <span className="text-[10px] text-slate-500">{weather.source.split('(')[0]}</span>
          </div>

          {/* Mini Metrics */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px]">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="text-slate-400">Humidity</span>
              <span className="text-white font-mono ml-auto">{current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Wind className="w-3 h-3 text-teal-400" />
              <span className="text-slate-400">Wind</span>
              <span className="text-white font-mono ml-auto">{current.windSpeed}km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <CloudRain className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400">Rain</span>
              <span className="text-white font-mono ml-auto">{current.rain}mm/hr</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Thermometer className="w-3 h-3 text-rose-400" />
              <span className="text-slate-400">Feels</span>
              <span className="text-white font-mono ml-auto">{current.feelsLike}°C</span>
            </div>
          </div>

          {/* Impact Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-400">Ops Impact</span>
              <span className={`font-bold ${
                impact.compositeImpact > 30 ? 'text-red-400' :
                impact.compositeImpact > 15 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {impact.compositeImpact}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  impact.compositeImpact > 30 ? 'bg-red-500' :
                  impact.compositeImpact > 15 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, impact.compositeImpact * 2)}%` }}
              />
            </div>
          </div>

          {/* Risk Badges */}
          <div className="flex gap-1.5 flex-wrap">
            {impact.monsoonAlert !== 'CLEAR' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {impact.monsoonAlert}
              </span>
            )}
            {impact.waterloggingRisk !== 'NONE' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                FLOOD: {impact.waterloggingRisk}
              </span>
            )}
            {upcomingRisk?.deteriorating && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold animate-pulse">
                ↑ DETERIORATING
              </span>
            )}
          </div>

          {/* Forecast Preview */}
          {upcomingRisk && (
            <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
              Next 6h: {upcomingRisk.worstCondition} • Max {upcomingRisk.maxRainNext6h}mm ({upcomingRisk.maxPrecipProbNext6h}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
