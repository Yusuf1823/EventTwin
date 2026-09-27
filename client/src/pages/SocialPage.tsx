import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert,
  MessageSquare, Clock, MapPin, TrendingUp, Hash, Activity,
  CloudRain, ThermometerSun, Siren, Bus, Heart
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';

interface Signal {
  id: string;
  type: string;
  severity: string;
  sentiment: string;
  source: string;
  hashtags: string[];
  text: string;
  timestamp: string;
  credibility: number;
  locationTag: string;
}

interface SentimentMetrics {
  overall: string;
  anxietyPct: number;
  safetyPct: number;
  disruptionPct: number;
  breakdown?: Record<string, number>;
}

interface ImpactSummary {
  weatherImpact: number;
  waterloggingRisk: string;
  monsoonAlert: string;
  operationalRecommendation: string;
}

interface SocialData {
  source: string;
  isLive: boolean;
  cached: boolean;
  generatedAt: string;
  weatherSource: string;
  currentWeather: {
    label: string;
    icon: string;
    temperature: number;
    rain: number;
    severity: string;
  };
  signals: Signal[];
  totalSignals: number;
  sentiment: SentimentMetrics;
  trendingHashtags: string[];
  impactSummary: ImpactSummary;
  error?: string;
}

const severityStyles: Record<string, string> = {
  'CRITICAL': 'bg-red-500/15 border-red-500/30 shadow-red-500/5',
  'HIGH': 'bg-orange-500/15 border-orange-500/30 shadow-orange-500/5',
  'MODERATE': 'bg-amber-500/15 border-amber-500/30 shadow-amber-500/5',
  'LOW': 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5'
};

const severityBadge: Record<string, string> = {
  'CRITICAL': 'bg-red-500/20 text-red-300 border-red-500/40',
  'HIGH': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'MODERATE': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'LOW': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
};

const typeIcon: Record<string, React.ReactNode> = {
  'CITIZEN_REPORT': <MessageSquare className="w-3.5 h-3.5" />,
  'TRAVELER_ALERT': <Bus className="w-3.5 h-3.5" />,
  'SAFETY_ALERT': <ShieldAlert className="w-3.5 h-3.5" />,
  'HEALTH_ADVISORY': <Heart className="w-3.5 h-3.5" />,
  'INFRASTRUCTURE_ALERT': <AlertTriangle className="w-3.5 h-3.5" />,
  'EMERGENCY_ALERT': <Siren className="w-3.5 h-3.5" />,
  'TRANSIT_UPDATE': <Bus className="w-3.5 h-3.5" />,
  'FORECAST_WARNING': <CloudRain className="w-3.5 h-3.5" />,
  'STATUS_UPDATE': <CheckCircle2 className="w-3.5 h-3.5" />,
  'OPERATIONS_UPDATE': <Activity className="w-3.5 h-3.5" />
};

const sentimentColor: Record<string, string> = {
  'CALM': 'text-emerald-400',
  'MILD CONCERN': 'text-yellow-400',
  'ELEVATED CONCERN': 'text-amber-400',
  'HIGH ANXIETY': 'text-red-400'
};

export const SocialPage: React.FC = () => {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSignals = useCallback(async () => {
    try {
      if (data) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/social-signals');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch social signals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(() => fetchSignals(), 3 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-cyan-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-mono">Syncing social intelligence...</span>
        </div>
      </div>
    );
  }

  const { signals, sentiment, trendingHashtags, impactSummary, currentWeather } = data;

  return (
    <div className="flex flex-col gap-6 page-enter">
      <PageHeader
        title="Social Pulse"
        accent={
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 et-heartbeat" />
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Live Social Intelligence Feed</span>
          </div>
        }
        subtitle="Weather-driven social intelligence — real sentiment analysis across BKC mega-event streams."
        actions={
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${
            data.isLive
              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
              : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
          }`}>
            {data.isLive ? '● LIVE' : '⚠ FALLBACK'}
          </span>
        }
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weather Context */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            Weather Context
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentWeather.icon}</span>
            <div>
              <div className="text-lg font-bold text-white">{currentWeather.temperature}°C</div>
              <div className="text-[10px] text-slate-400">{currentWeather.label}</div>
            </div>
          </div>
        </div>

        {/* Sentiment Gauge */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Crowd Sentiment
          </div>
          <div className={`text-lg font-black ${sentimentColor[sentiment.overall] || 'text-white'}`}>
            {sentiment.overall}
          </div>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-red-400">Anxiety: {sentiment.anxietyPct}%</span>
            <span className="text-[10px] text-emerald-400">Safety: {sentiment.safetyPct}%</span>
          </div>
        </div>

        {/* Weather Impact on Ops */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Ops Impact
          </div>
          <div className="text-lg font-black text-white">{impactSummary.weatherImpact}%</div>
          <div className="flex gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              impactSummary.waterloggingRisk === 'NONE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              impactSummary.waterloggingRisk === 'LOW' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
              impactSummary.waterloggingRisk === 'MODERATE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
              'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              Flood: {impactSummary.waterloggingRisk}
            </span>
          </div>
        </div>

        {/* Signal Count */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Active Signals
          </div>
          <div className="text-lg font-black text-white">{data.totalSignals}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {data.generatedAt ? `Updated: ${new Date(data.generatedAt).toLocaleTimeString('en-IN')}` : ''}
          </div>
        </div>
      </div>

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Hash className="w-4 h-4 text-cyan-400" />
          {trendingHashtags.map((tag, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Operational Recommendation Banner */}
      <div className={`p-4 rounded-xl border ${
        impactSummary.weatherImpact > 30 ? 'bg-red-500/10 border-red-500/30' :
        impactSummary.weatherImpact > 10 ? 'bg-amber-500/10 border-amber-500/30' :
        'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <ShieldAlert className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
            impactSummary.weatherImpact > 30 ? 'text-red-400' :
            impactSummary.weatherImpact > 10 ? 'text-amber-400' : 'text-emerald-400'
          }`} />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              AI Operational Recommendation
            </div>
            <p className="text-sm text-slate-300">{impactSummary.operationalRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Live Signal Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          LIVE SIGNAL FEED
          <span className="text-[10px] text-slate-500 font-normal ml-2">
            Weather-driven • Auto-refreshed every 3 min
          </span>
        </h3>

        {signals.map((signal, i) => {
          const timeAgo = getTimeAgo(signal.timestamp);
          return (
            <div
              key={signal.id || i}
              className={`p-4 rounded-xl border shadow-lg transition-all hover:scale-[1.01] ${
                severityStyles[signal.severity] || 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${
                    signal.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    signal.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    signal.severity === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {typeIcon[signal.type] || <MessageSquare className="w-3.5 h-3.5" />}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-white">{signal.source}</span>
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      severityBadge[signal.severity] || severityBadge['LOW']
                    }`}>
                      {signal.severity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  {timeAgo}
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed mb-2">{signal.text}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-400">{signal.locationTag}</span>
                </div>
                <div className="flex items-center gap-2">
                  {signal.hashtags && (Array.isArray(signal.hashtags) ? (signal.hashtags as string[]) : String(signal.hashtags).split(' ')).slice(0, 3).map((tag: string, j: number) => (
                    <span key={j} className="text-[10px] text-cyan-400/70 font-mono">{tag}</span>
                  ))}
                  <span className="text-[10px] text-slate-500 ml-1">
                    Credibility: {Math.round((signal.credibility || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
