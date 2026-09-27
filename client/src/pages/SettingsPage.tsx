import React, { useState } from 'react';
import { Settings, UserCheck, Shield, Sliders, RotateCcw, Check, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../tutorial/TutorialContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { startTutorial } = useTutorial();
  const [eventName, setEventName] = useState('Mumbai Global Mega-Concert & Expo 2026');
  const [threshold, setThreshold] = useState(85);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Platform configurations, user access clearance, and simulation thresholds.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
        {/* User Clearance */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{user?.name || 'Commander Alex'}</h2>
              <p className="text-xs text-slate-400">{user?.email || 'alex@ghostprotocol.ai'}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
            {user?.role || 'City Operations'}
          </span>
        </div>

        {/* Event Profile */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Event Profile Configuration</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Active Event Title</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Critical Stress Alarm Threshold ({threshold}%)
            </label>
            <input
              type="range"
              min={70}
              max={95}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Tutorial */}
        <div className="flex flex-col gap-3 mt-1 border-t border-slate-800 pt-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Onboarding & Tutorial</h3>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Need a refresher on how to use the EventTwin dashboard, digital twin map, and predictions engine?
            </div>
            <button
              onClick={startTutorial}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              Replay Tutorial
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-500">EventTwin Engine v3.0 (by Ghost Protocol)</span>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            <span>{saved ? 'Saved Successfully' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
