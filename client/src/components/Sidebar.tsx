import React, { useState } from 'react';
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
  X,
  CloudRain,
  Radio,
  Bot,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '../ui/cn';

const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Digital Twin', path: '/digital-twin', icon: Cpu },
  { name: 'Predictions', path: '/predictions', icon: TrendingUp },
  { name: 'What-If', path: '/simulator', icon: Sliders },
  { name: 'Operations', path: '/operations', icon: Compass },
  { name: 'Nugen AI', path: '/nugen', icon: Bot, badge: 'Task 2' },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Weather Intel', path: '/weather', icon: CloudRain },
  { name: 'Social Pulse', path: '/social', icon: Radio },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'bg-[#070b14]/95 backdrop-blur-xl border-r border-white/8 flex flex-col justify-between p-3 h-screen select-none z-50 transition-all duration-300 ease-out fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:translate-x-0',
        collapsed ? 'w-[76px]' : 'w-64',
        isOpen ? 'translate-x-0 shadow-2xl shadow-cyan-950/40' : '-translate-x-full'
      )}
    >
      <div className="min-h-0 flex flex-col">
        <div className={cn('flex items-center mb-5 px-1 pt-1', collapsed ? 'flex-col gap-3 justify-center' : 'justify-between')}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.25)] border border-white/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="font-display font-extrabold tracking-[0.18em] text-xs text-white">EVENTTWIN</h2>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest block -mt-0.5">
                  Mission Control
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 lg:hidden cursor-pointer"
                aria-label="Close navigation sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-white/5 cursor-pointer"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 overflow-y-auto pr-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : undefined}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-xl text-xs font-semibold transition',
                    collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-200 border border-cyan-400/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/4 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    )}
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="flex-1">{item.name}</span>}
                    {!collapsed && item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className={cn('pt-3 border-t border-white/8 flex flex-col gap-2', collapsed && 'items-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white/4 border border-white/8">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Commander Alex'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.role || 'City Operations'}</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <UserCheck className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            'flex items-center gap-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer',
            collapsed ? 'justify-center p-2' : 'px-3 py-2'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
