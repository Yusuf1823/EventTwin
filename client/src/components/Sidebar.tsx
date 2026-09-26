import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  Cpu,
  TrendingUp,
  Sliders,
  Compass,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  UserCheck,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Digital Twin', path: '/digital-twin', icon: Cpu },
  { name: 'Predictions', path: '/predictions', icon: TrendingUp },
  { name: 'What-If', path: '/simulator', icon: Sliders },
  { name: 'Operations', path: '/operations', icon: Compass },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  return (
    <aside
      className={`w-64 bg-slate-950/95 border-r border-slate-800 flex flex-col justify-between p-4 h-screen select-none z-50 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl shadow-indigo-950/50' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand & Logo */}
        <div className="flex items-center justify-between px-2 py-3 mb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                EVENTTWIN
              </h2>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest block -mt-0.5">
                by Ghost Protocol
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600/20 text-cyan-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Commander Alex'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.role || 'City Operations'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
