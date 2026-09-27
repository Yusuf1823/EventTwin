import React from 'react';
import { ArrowRight, CloudRain, Cpu, Radio, TrendingUp, Sliders, Sparkles, Compass } from 'lucide-react';

export interface TutorialStep {
  id: string;
  targetSelector: string;
  title: string;
  content: string | ((liveState: any) => React.ReactNode);
  route: string;
  preStepAction?: () => Promise<void> | void;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  waitForAction?: string;
  actionButtonLabel?: string;
  actionButtonOnClick?: () => void;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'step-1-stress-index',
    targetSelector: '[data-tutorial="stress-index"]',
    title: 'City Stress Index',
    content: (liveState) => (
      <span>
        This card monitors the overall stress on the urban ecosystem. Right now, the live city stress is at <strong className="text-rose-400">{liveState?.cityStress ?? 69}%</strong>.
      </span>
    ),
    route: '/dashboard',
    placement: 'bottom'
  },
  {
    id: 'step-2-digital-twin',
    targetSelector: '[data-tutorial="digital-twin-map"]',
    title: 'Digital Twin Map & Flood Layer',
    content: (liveState) => {
      // Dynamic logic for map step
      return (
        <div className="flex flex-col gap-2">
          <span>Interactive geospatial map pulling real telemetry. You can visualize weather impacts on infrastructure.</span>
        </div>
      );
    },
    route: '/dashboard',
    placement: 'top',
    actionButtonLabel: 'Show Flood Layer',
    actionButtonOnClick: () => {
      window.dispatchEvent(new Event('et-tutorial-show-flood'));
    },
  },
  {
    id: 'step-3-predictions',
    targetSelector: '[data-tutorial="predictions-banner"]',
    title: 'Predictive Forecasting',
    content: 'Forward-looking AI predictions across 15, 30, and 45-minute horizons.',
    route: '/predictions',
    placement: 'bottom'
  },
  {
    id: 'step-4-simulator',
    targetSelector: '[data-tutorial="simulator-controls"]',
    title: 'What-If Simulator',
    content: 'Tweak weather, transit, and crowd parameters to simulate cascading effects. Try adjusting a scenario slider now to proceed.',
    route: '/simulator',
    placement: 'right',
    waitForAction: 'simulator_moved'
  },
  {
    id: 'step-5-nugen',
    targetSelector: '[data-tutorial="nugen-copilot"]',
    title: 'Nugen AI Copilot',
    content: 'Domain-aligned intelligence agent providing prescriptive advice. Send a query in the chat below to proceed.',
    route: '/simulator',
    placement: 'top',
    waitForAction: 'nugen_query'
  },
  {
    id: 'step-6-operations',
    targetSelector: '[data-tutorial="operations-card"]',
    title: 'Operations & Dispatch',
    content: (liveState) => {
      const op = liveState?.firstOperation;
      if (!op) return 'Execute and dispatch rebalancing interventions.';
      return (
        <div className="flex flex-col gap-1.5">
          <span>Execute and dispatch rebalancing interventions. The AI currently recommends:</span>
          <div className="p-2 bg-indigo-950/40 rounded border border-indigo-500/30 text-[10px] font-mono mt-1">
            <strong className="text-cyan-300 block mb-1">WHY: {op.target}</strong>
            <span className="text-slate-300 block mb-1">ACTION: {op.recommendation}</span>
            <span className="text-emerald-400 block">EFFECT: {op.impact}</span>
          </div>
        </div>
      );
    },
    route: '/operations',
    placement: 'top'
  },
  {
    id: 'step-7-alerts',
    targetSelector: '[data-tutorial="alerts-panel"]',
    title: 'Severity Alerts',
    content: 'Real-time alert monitoring with severity-based filtering. That concludes the tour!',
    route: '/alerts',
    placement: 'bottom'
  }
];
