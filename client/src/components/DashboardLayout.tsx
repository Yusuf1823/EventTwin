import React, { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Shield, Activity, ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':    'Overview',
  '/digital-twin': 'Digital Twin',
  '/predictions':  'Predictions',
  '/simulator':    'What-If Simulator',
  '/operations':   'Operations',
  '/nugen':        'Nugen AI Copilot',
  '/analytics':    'Analytics',
  '/weather':      'Weather Intel',
  '/social':       'Social Pulse',
  '/alerts':       'Alerts',
  '/settings':     'Settings',
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('et-sidebar-collapsed') === '1');
  const [tick, setTick] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t >= 59 ? 0 : t + 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('et-sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  };

  const pageLabel = ROUTE_LABELS[location.pathname] || location.pathname.replace('/', '');

  return (
    <div className="min-h-screen bg-[#05080f] flex flex-col lg:flex-row text-slate-100 selection:bg-cyan-500/30 selection:text-white">

      {/* ── MOBILE TOP BAR ── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#070b14]/92 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center border border-white/20 shadow-[0_0_14px_rgba(34,211,238,0.2)]">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-extrabold text-xs tracking-[0.18em] text-white">EVENTTWIN</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono font-bold text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 et-heartbeat" />
          <span>LIVE</span>
        </div>
      </header>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── DESKTOP TOPBAR ── */}
        <div className="hidden lg:flex items-center justify-between px-6 xl:px-8 py-2.5 border-b border-white/6 bg-[#070b14]/72 backdrop-blur-xl sticky top-0 z-30">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="uppercase tracking-[0.18em] text-slate-600">JWCC · BKC</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-slate-300 font-semibold">{pageLabel}</span>
          </nav>

          {/* Status pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/18 text-[10px]">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 et-heartbeat" />
              <span className="font-mono font-bold text-emerald-300 uppercase tracking-wide">Simulation Live</span>
              <span className="text-slate-700 mx-0.5">|</span>
              <span className="font-mono text-slate-500 tabular-nums">T+{String(tick).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
