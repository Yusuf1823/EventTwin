import React, { useState } from 'react';
import { Bot, Sparkles, Send, RefreshCw, ShieldAlert, CloudRain, ShieldCheck, Compass, Hotel } from 'lucide-react';

interface NugenCopilotProps {
  currentMetrics?: {
    cityStress?: number;
    venueLoad?: number;
    transitLoad?: number;
    parkingLoad?: number;
    hotelOccupancy?: number;
  };
  currentWeather?: any;
  currentScenario?: any;
  defaultExpanded?: boolean;
}

export const NugenCopilot: React.FC<NugenCopilotProps> = ({
  currentMetrics = {},
  currentWeather = null,
  currentScenario = null,
  defaultExpanded = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adviceData, setAdviceData] = useState<any>(null);

  const QUICK_PROMPTS = [
    {
      label: '🚨 Gate Saturation (>100%)',
      query: 'JWCC turnstiles are operating at 112% capacity. Prescribe immediate crowd crush mitigation and gate throttling actions.'
    },
    {
      label: '⛈️ Monsoon Kurla Flooding',
      query: 'Torrential rain (35mm/hr) detected. Kurla rail underpass is flooding. Outline emergency transit rerouting and dewatering pump protocols.'
    },
    {
      label: '🔄 Zone A ➔ Zone C Dispatch',
      query: 'Zone A is severely strained while Zone C has 8,250 free parking bays. Prescribe the exact strict-conservation rebalancing protocol.'
    },
    {
      label: '🏨 Stranded Guests Sheltering',
      query: 'Thousands of attendees are stranded by flash downpours outside JWCC. Prescribe emergency hospitality sheltering and poncho distribution SOPs.'
    }
  ];

  const handleAskNugen = async (promptText?: string) => {
    const textToSend = promptText || query;
    setIsLoading(true);

    try {
      const res = await fetch('/api/nugen/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          metrics: currentMetrics,
          weather: currentWeather,
          scenario: currentScenario
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAdviceData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch Nugen advice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-950/90 to-purple-950/40 p-4 shadow-xl backdrop-blur-xl">
      {/* Header & Verification Pipeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3.5 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                NUGEN INTELLIGENCE COPILOT
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE INFERENCE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Domain-Aligned AI Incident Advisor for BKC Urban Mega-Events
            </p>
          </div>
        </div>

        {/* Mandatory Pipeline Badge */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[9.5px] font-mono flex items-center gap-1.5 text-slate-300">
          <span className="text-purple-300 font-bold">Base: gpt-oss-120b</span>
          <span className="text-slate-600">➔</span>
          <span className="text-cyan-300 font-bold">Aligned: doc_01m3fx1747zmmhh3</span>
          <span className="text-slate-600">➔</span>
          <span className="text-emerald-400 font-bold">EventTwin Copilot</span>
        </div>
      </div>

      {/* Quick Tactical Action Triggers */}
      <div className="mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          ⚡ Quick Tactical Dispatches:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10.5px]">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(p.query);
                handleAskNugen(p.query);
              }}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white font-medium text-left transition cursor-pointer disabled:opacity-50"
            >
              <span className="line-clamp-1">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim() && !isLoading) {
              handleAskNugen();
            }
          }}
          placeholder="Ask Nugen Aligned Copilot for tactical advice or dispatch protocol..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
        />
        <button
          type="button"
          onClick={() => handleAskNugen()}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>INFERRING...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>DISPATCH</span>
            </>
          )}
        </button>
      </div>

      {/* Output Panel */}
      {adviceData && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1 text-cyan-300 font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              NUGEN ALIGNED OPERATIONAL DIRECTIVE
            </span>
            <span className="font-mono text-slate-500">
              Model: {adviceData.pipeline?.baseModel} • Tokens: {adviceData.tokens?.total_tokens || 280}
            </span>
          </div>

          <div className="text-slate-200 leading-relaxed font-sans whitespace-pre-line text-[11.5px] max-h-60 overflow-y-auto pr-1">
            {adviceData.advice}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-900 font-mono">
            <span>Verified Domain Alignment: {adviceData.pipeline?.alignmentProject}</span>
            <span>Generated: {new Date(adviceData.generatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
