import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight, Activity, Cpu, Hotel, Navigation, Car, Building, Sparkles, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEnter = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const scrollToExplore = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-cyan-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-base bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                EVENTTWIN
              </span>
              <span className="text-[10px] text-slate-500 block -mt-1 font-mono tracking-widest">by Ghost Protocol</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <span>Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 relative z-10 max-w-5xl mx-auto">
        {/* Futuristic Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-cyan-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AI-Powered Hospitality Digital Twin for Mega-Events</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight sm:leading-none mb-6">
          Predict the city before the city gets <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">overwhelmed.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed mb-10">
          AI-powered hospitality intelligence for managing mega-event infrastructure across venues, hotels, transit and parking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={handleEnter}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <span>ENTER COMMAND CENTER</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={scrollToExplore}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
          >
            EXPLORE HOW IT WORKS
          </button>
        </div>

        {/* City Network Visual (Hotels, Transit, Parking, Venues) */}
        <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 border border-slate-800/90 relative overflow-hidden shadow-2xl">
          <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase text-center mb-6 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Connected Urban Ecosystem Telemetry</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Venues */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 flex flex-col items-center text-center group hover:border-purple-500/60 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2.5">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-200">VENUES</h3>
              <span className="text-[11px] text-slate-400 mt-1">Turnstiles & Gates</span>
              <span className="text-[10px] font-mono text-purple-300 mt-2 px-2 py-0.5 rounded bg-purple-500/10">
                1,400 visitors/min
              </span>
            </div>

            {/* Hotels */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 flex flex-col items-center text-center group hover:border-amber-500/60 transition">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2.5">
                <Hotel className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-200">HOTELS</h3>
              <span className="text-[11px] text-slate-400 mt-1">Lobbies & Occupancy</span>
              <span className="text-[10px] font-mono text-amber-300 mt-2 px-2 py-0.5 rounded bg-amber-500/10">
                84% Average Load
              </span>
            </div>

            {/* Transit */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 flex flex-col items-center text-center group hover:border-cyan-500/60 transition">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-2.5">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-200">TRANSIT</h3>
              <span className="text-[11px] text-slate-400 mt-1">Metro & Rail Artery</span>
              <span className="text-[10px] font-mono text-cyan-300 mt-2 px-2 py-0.5 rounded bg-cyan-500/10">
                91% Artery Usage
              </span>
            </div>

            {/* Parking */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 flex flex-col items-center text-center group hover:border-emerald-500/60 transition">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2.5">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-200">PARKING</h3>
              <span className="text-[11px] text-slate-400 mt-1">Smart Park & Ride</span>
              <span className="text-[10px] font-mono text-emerald-300 mt-2 px-2 py-0.5 rounded bg-emerald-500/10">
                8,250 Spillover Free
              </span>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="mt-28 w-full text-left">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Predict. Simulate. Optimize.</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Simulate. Predict. Act.</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              How EventTwin eliminates urban silos during mega-events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-cyan-400 mb-2">01</div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Simulate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects hotels, transit lines, parking hubs, and venues into a single real-time digital twin map.
              </p>
            </div>
            <div className="glass-panel p-6 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-indigo-400 mb-2">02</div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Predict</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies bottlenecks hours ahead (Zone A at 125% capacity) while pinpointing available capacity (Zone C at 45%).
              </p>
            </div>
            <div className="glass-panel p-6 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-emerald-400 mb-2">03</div>
              <h3 className="text-base font-bold text-slate-100 mb-2">Act</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prescriptively redirects shuttles, shifts parking reservations, and staggers gate admissions, slashing city stress.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Clean Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EventTwin • Predict. Simulate. Optimize. • by Ghost Protocol</span>
          <span>HackCelestial 3.0 • Mahatma Education Society's Pillai University</span>
        </div>
      </footer>
    </div>
  );
};
