import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      title: 'Lower-pressure capacity detected in another zone',
      whatHappened: 'Kalina Spillover Hub currently operates at 45% load with 8,250 empty bays.',
      whyItMatters: "Diverting 15% of Zone A's flow to Zone C eliminates critical bottlenecks and lowers overall city stress via spatial rebalancing.",
      whatCanBeDone: 'Simulate automated dynamic rebalancing to unlock balanced city flow.',
      time: '20 mins ago',
      actionRoute: '/simulator'
    }
  ];

  const [alerts, setAlerts] = useState<AlertItem[]>(DEFAULT_ALERTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [alertsRes, predRes] = await Promise.all([
          fetch('/api/alerts'),
          fetch('/api/predictions')
        ]);

        const combinedAlerts: AlertItem[] = [];

        // 1. Process Predicted Critical Risk items from prediction API
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

        // 2. Process real-time operational alerts
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

        if (combinedAlerts.length > 0) {
          setAlerts(combinedAlerts);
        }
      } catch (err) {
        console.warn('Backend alerts fetch fallback:', err);
        setError('Using cached alert feed.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Alerts</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Priority operational notices across city infrastructure.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-500/30">
          {alerts.length} Active Notices
        </span>
      </div>

      {loading && (
        <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
          Loading priority incident feed...
        </div>
      )}

      {/* Alert Feed */}
      <div className="flex flex-col gap-4">
        {alerts.map((alert: AlertItem) => {
          const isPredCrit = alert.severity === 'PREDICTED CRITICAL RISK';
          const isCrit = alert.severity === 'CRITICAL' || alert.type === 'CRITICAL';
          const isAttn = alert.severity === 'ATTENTION' || alert.type === 'ATTENTION';

          return (
            <div
              key={alert.id}
              className={`glass-panel p-6 rounded-2xl border flex flex-col gap-4 transition ${
                isPredCrit
                  ? 'border-rose-500/60 bg-rose-950/20 glow-red'
                  : isCrit
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isAttn
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-cyan-500/40 bg-cyan-950/10'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-black border uppercase ${
                      isPredCrit
                        ? 'bg-rose-500/30 text-rose-200 border-rose-500/50'
                        : isCrit
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isAttn
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {isPredCrit ? '🔴 PREDICTED CRITICAL RISK' : isCrit ? '🔴 CRITICAL' : isAttn ? '🟡 ATTENTION' : '🔵 AI INSIGHT'}
                  </span>
                  <h2 className="text-base font-bold text-white">{alert.title}</h2>
                </div>

                <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {alert.time}
                </span>
              </div>

              {/* What Happened, Why It Matters, What Can Be Done */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">What happened:</span>
                  <p className="text-slate-200 leading-relaxed">{alert.whatHappened}</p>
                </div>
                <div>
                  <span className="text-amber-400 font-bold block mb-1">Why it matters:</span>
                  <p className="text-slate-200 leading-relaxed">{alert.whyItMatters}</p>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block mb-1">What can be done:</span>
                  <p className="text-slate-200 leading-relaxed">{alert.whatCanBeDone}</p>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(alert.actionRoute)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Resolve in Operations</span>
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
