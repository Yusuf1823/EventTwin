import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Sparkles, Clock, CheckCircle2, ArrowRight, Radio, Zap, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader';
import { GlassCard } from '../ui/GlassCard';
import { RiskBadge } from '../ui/RiskBadge';

interface AlertItem {
  id: string;
  severity: string;
  type?: string;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  whatCanBeDone: string;
  time: string;
  actionRoute: string;
}

const SEVERITY_CONFIG: Record<string, {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ReactNode;
  label: string;
}> = {
  'PREDICTED CRITICAL RISK': {
    border: 'border-rose-500/60',
    bg: 'bg-rose-950/18',
    badgeBg: 'bg-rose-500/25',
    badgeText: 'text-rose-200',
    badgeBorder: 'border-rose-400/55',
    icon: <Zap className="w-3.5 h-3.5" />,
    label: 'PREDICTED CRITICAL',
  },
  CRITICAL: {
    border: 'border-rose-500/45',
    bg: 'bg-rose-950/12',
    badgeBg: 'bg-rose-500/18',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'CRITICAL',
  },
  ATTENTION: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/10',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: 'ATTENTION',
  },
  'AI INSIGHT': {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/10',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'AI INSIGHT',
  },
};

const getSeverityConfig = (sev: string) =>
  SEVERITY_CONFIG[sev] || SEVERITY_CONFIG['ATTENTION'];

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();

  const DEFAULT_ALERTS: AlertItem[] = [
    {
      id: 'alt_1',
      severity: 'CRITICAL',
      title: 'JWCC area predicted to exceed simulated capacity pressure',
      whatHappened: 'Ingress turnstiles at Jio World Convention Centre are clocking 1,400 visitors per minute.',
      whyItMatters: 'Entry gates 1 through 4 will bottleneck, creating a crush hazard along Avenue 3 in 42 minutes.',
      whatCanBeDone: 'Activate dynamic gate staggering vouchers and redirect incoming flows toward Zone C concourses.',
      time: '3 mins ago',
      actionRoute: '/operations'
    },
    {
      id: 'alt_2',
      severity: 'ATTENTION',
      title: 'Trident BKC simulated occupancy approaching threshold',
      whatHappened: 'Trident Bandra Kurla is 91% occupied with 1,240 expected VIP and delegation arrivals.',
      whyItMatters: 'Front desk check-in queue delay will spill into the porte-cochère and BKC G Block artery.',
      whatCanBeDone: 'Open secondary baggage holding and divert excess bookings to Airport transit hotels.',
      time: '9 mins ago',
      actionRoute: '/operations'
    },
    {
      id: 'alt_3',
      severity: 'ATTENTION',
      title: 'Transit connection experiencing simulated overload',
      whatHappened: 'BKC Metro Line 3 station platform load has reached 91% (predicted 108%).',
      whyItMatters: 'Platform safety thresholds will trigger automated gate throttling.',
      whatCanBeDone: 'Direct commuter crowds toward Bandra suburban railway terminal feeder buses.',
      time: '15 mins ago',
      actionRoute: '/operations'
    },
    {
      id: 'alt_4',
      severity: 'AI INSIGHT',
      title: 'Lower-pressure capacity detected in Zone C spillover hub',
      whatHappened: 'Kalina Spillover Hub currently operates at 45% load with 8,250 empty bays.',
      whyItMatters: "Diverting 15% of Zone A's flow to Zone C eliminates critical bottlenecks and lowers overall city stress via spatial rebalancing.",
      whatCanBeDone: 'Simulate automated dynamic rebalancing to unlock balanced city flow.',
      time: '20 mins ago',
      actionRoute: '/simulator'
    }
  ];

  const [alerts, setAlerts] = useState<AlertItem[]>(DEFAULT_ALERTS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [alertsRes, predRes] = await Promise.all([
          fetch('/api/alerts'),
          fetch('/api/predictions')
        ]);

        const combinedAlerts: AlertItem[] = [];

        if (predRes.ok) {
          const predData = await predRes.json();
          if (predData.resources) {
            predData.resources
              .filter((r: any) => r.minutesUntilCritical !== null)
              .forEach((r: any) => {
                const projLoad = r.forecasts?.['45min'] || r.forecasts?.['30min'] || 105;
                const minText = r.minutesUntilCritical === 0 ? 'immediate active overload' : `in approx ${r.minutesUntilCritical} min`;
                combinedAlerts.push({
                  id: `pred_alert_${r.resource}`,
                  severity: 'PREDICTED CRITICAL RISK',
                  title: `Predicted Critical Risk — ${r.resource} expected to reach ${projLoad}% ${minText}`,
                  whatHappened: `Forward-looking predictive forecasting indicates ${r.resource} (currently at ${r.currentLoad}% load) will cross the 100% safe capacity threshold.`,
                  whyItMatters: `Unmitigated visitor ingress and ripple-effect delays risk localized bottleneck choke within ${r.minutesUntilCritical} minutes.`,
                  whatCanBeDone: `Inspect multi-horizon matrix on Predictions Page and trigger spatial rebalancing toward Zone C Kalina buffer.`,
                  time: `Forecast +${r.minutesUntilCritical}m`,
                  actionRoute: '/predictions'
                });
              });
          }
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          if (data.alerts && data.alerts.length > 0) {
            data.alerts.forEach((a: any) => {
              combinedAlerts.push({
                id: a.id || `alt_${Date.now()}_${Math.random()}`,
                severity: a.severity || 'ATTENTION',
                title: a.title || 'Operational Notification',
                whatHappened: a.whatHappened || '',
                whyItMatters: a.whyItMatters || '',
                whatCanBeDone: a.whatCanBeDone || '',
                time: a.time || 'Just now',
                actionRoute: a.severity === 'AI INSIGHT' ? '/simulator' : '/operations'
              });
            });
          }
        }

        if (combinedAlerts.length > 0) setAlerts(combinedAlerts);
      } catch (err) {
        console.warn('Backend alerts fetch fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const FILTER_OPTIONS = ['ALL', 'CRITICAL', 'ATTENTION', 'AI INSIGHT'];
  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter || (filter === 'CRITICAL' && a.severity === 'PREDICTED CRITICAL RISK'));

  const critCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'PREDICTED CRITICAL RISK').length;
  const attnCount = alerts.filter(a => a.severity === 'ATTENTION').length;
  const aiCount   = alerts.filter(a => a.severity === 'AI INSIGHT').length;

  return (
    <div className="flex flex-col gap-6 page-enter">

      {/* ── HEADER ── */}
      <PageHeader
        title="Alerts"
        accent={
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400 et-heartbeat" />
            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">Live Incident Feed</span>
          </div>
        }
        subtitle="Priority operational notices across city infrastructure."
        actions={
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-500/30">
            {alerts.length} Active Notices
          </span>
        }
      />

      {/* ── SUMMARY STRIP ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Critical / Predicted', count: critCount, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25' },
          { label: 'Attention Required', count: attnCount, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' },
          { label: 'AI Insights', count: aiCount, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/25' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`glass-panel rounded-2xl p-3.5 border ${bg} flex flex-col gap-1`}>
            <span className={`text-2xl font-extrabold font-mono tabular-nums ${color}`}>{count}</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      {/* ── FILTER ROW ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition ${
              filter === f
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-white/3 text-slate-500 border-white/8 hover:text-white hover:border-white/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
          Loading priority incident feed...
        </div>
      )}

      {/* ── ALERT FEED ── */}
      <div className="flex flex-col gap-4" data-tutorial="alerts-panel">
        {filtered.map((alert: AlertItem, idx: number) => {
          const cfg = getSeverityConfig(alert.severity);
          const isPredCrit = alert.severity === 'PREDICTED CRITICAL RISK';

          return (
            <div
              key={alert.id}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`glass-panel rounded-2xl border flex flex-col gap-0 overflow-hidden transition et-alert-in ${cfg.border} ${cfg.bg}`}
            >
              {/* Severity stripe */}
              <div className={`px-5 py-3 flex items-center justify-between gap-3 border-b ${cfg.border} bg-black/10`}>
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-black border uppercase ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} ${isPredCrit ? 'et-risk-pulse' : ''}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  <h2 className="text-sm font-bold text-white leading-snug">{alert.title}</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </span>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/6">
                {[
                  { label: 'What happened', text: alert.whatHappened, color: 'text-slate-400' },
                  { label: 'Why it matters', text: alert.whyItMatters, color: 'text-amber-400' },
                  { label: 'What can be done', text: alert.whatCanBeDone, color: 'text-emerald-400' },
                ].map(({ label, text, color }) => (
                  <div key={label} className="px-5 py-4 flex flex-col gap-1.5 text-xs">
                    <span className={`font-bold text-[10px] uppercase tracking-wider ${color}`}>{label}</span>
                    <p className="text-slate-200 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* Action footer */}
              <div className="px-5 py-3 border-t border-white/6 bg-black/10 flex justify-end">
                <button
                  onClick={() => navigate(alert.actionRoute)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  {isPredCrit ? 'View Predictions' : 'Resolve in Operations'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
