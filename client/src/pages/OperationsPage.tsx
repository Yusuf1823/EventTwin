import React, { useState } from 'react';
import { Compass, CheckCircle2, Clock, Send, ShieldAlert, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OperationAction {
  id: string;
  title: string;
  target: string;
  recommendation: string;
  impact: string;
  state: 'SIMULATE ACTION' | 'ACTION APPROVED' | 'READY TO DISPATCH';
  interventionPayload: any;
}

const INITIAL_OPERATIONS: OperationAction[] = [
  {
    id: 'op_1',
    title: 'REDIRECT VISITORS',
    target: 'Zone A is approaching capacity (JWCC venue > 100%).',
    recommendation: 'Divert 15% of incoming visitors toward Zone C Kalina concourses.',
    impact: 'Conserves total visitors while cutting Zone A crowd pressure and turnstile chokes.',
    state: 'SIMULATE ACTION',
    interventionPayload: { interventions: { redirectVisitors: true, visitorDiversionPct: 15 } }
  },
  {
    id: 'op_2',
    title: 'REROUTE SHUTTLES',
    target: 'BKC Avenue 3 access corridor experiencing queue bottlenecks.',
    recommendation: 'Boost Kalina-Kurla bypass electric shuttle frequency by 45%.',
    impact: 'Dampens road turnaround time and connects Zone C parkers directly to venue gates.',
    state: 'SIMULATE ACTION',
    interventionPayload: { interventions: { rerouteShuttles: true } }
  },
  {
    id: 'op_3',
    title: 'REDISTRIBUTE PARKING',
    target: 'JWCC on-premise parking facility near saturation (Lot G).',
    recommendation: 'Divert 22% of inbound vehicles toward Kalina Overflow Lot.',
    impact: 'Conserves total parked vehicles; utilizes over 8,250 free parking bays in Zone C.',
    state: 'SIMULATE ACTION',
    interventionPayload: { interventions: { redistributeParking: true, parkingDiversionPct: 22 } }
  }
];

export const OperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<OperationAction[]>(INITIAL_OPERATIONS);

  const handleAdvanceState = async (id: string) => {
    const op = operations.find(o => o.id === id);
    if (!op) return;

    let nextState: OperationAction['state'] = 'SIMULATE ACTION';

    if (op.state === 'SIMULATE ACTION') {
      nextState = 'ACTION APPROVED';
      confetti({ particleCount: 40, spread: 50 });
      try {
        const res = await fetch('/api/interventions/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.interventionPayload)
        });
        if (res.ok) {
          const data = await res.json();
          const sim = data.simulation;
          if (sim) {
            setOperations(prev => prev.map(item => {
              if (item.id === id) {
                return {
                  ...item,
                  impact: `Calculated: Zone A load dropped to ${sim.after.zoneALoad || sim.after.venueLoad}%, system stress reduced to ${sim.after.cityStress}%.`,
                  state: nextState
                };
              }
              return item;
            }));
            return;
          }
        }
      } catch (err) {
        console.warn('Intervention simulate error:', err);
      }
    } else if (op.state === 'ACTION APPROVED') {
      nextState = 'READY TO DISPATCH';
      try {
        await fetch('/api/interventions/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.interventionPayload)
        });
      } catch (err) {}
    } else {
      nextState = 'SIMULATE ACTION';
      try {
        await fetch('/api/digital-twin/reset', { method: 'POST' });
      } catch (err) {}
    }

    setOperations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, state: nextState } : item))
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Take Action</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Prescriptive interventions to rebalance urban load across the event ecosystem.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>DYNAMIC OPERATIONAL ENGINE</span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {operations.map((op) => {
          const isApproved = op.state === 'ACTION APPROVED';
          const isDispatched = op.state === 'READY TO DISPATCH';

          return (
            <div
              key={op.id}
              className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between gap-6 transition-all ${
                isDispatched
                  ? 'border-emerald-500/50 bg-emerald-950/15'
                  : isApproved
                  ? 'border-indigo-500/50 bg-indigo-950/15'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Card Title & State Badge */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">{op.title}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      isDispatched
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : isApproved
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {op.state}
                  </span>
                </div>

                {/* Target & Recommendation */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Target Situation:</span>
                    <p className="text-slate-200 font-semibold">{op.target}</p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">Recommendation:</span>
                    <p className="text-slate-200">{op.recommendation}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Projected Outcome:</span>
                    <p className="text-emerald-400 text-[11.5px] leading-relaxed">{op.impact}</p>
                  </div>
                </div>
              </div>

              {/* State Cycle Action Button */}
              <button
                onClick={() => handleAdvanceState(op.id)}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isDispatched
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                    : isApproved
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {isDispatched ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>READY TO DISPATCH (RESET)</span>
                  </>
                ) : isApproved ? (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>AUTHORIZE: READY TO DISPATCH</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SIMULATE ACTION</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Demo Disclosure Box */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
        <p>
          <strong>Operational Protocol Integrity:</strong> Actions cycle through{' '}
          <code className="text-slate-200">SIMULATE ACTION</code> ➔{' '}
          <code className="text-indigo-300">ACTION APPROVED</code> ➔{' '}
          <code className="text-emerald-300">READY TO DISPATCH</code>. Calculations adhere to strict spatial conservation laws (total visitors and parked vehicles are conserved upon redistribution).
        </p>
      </div>
    </div>
  );
};
