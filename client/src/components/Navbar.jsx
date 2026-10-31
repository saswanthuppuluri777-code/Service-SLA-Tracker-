import React, { useState } from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Ticket,
  Sliders,
  History,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  currentUser,
  setCurrentUser,
  users = [],
  onReseed,
  isReseeding,
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets Hub', icon: Ticket },
    { id: 'policies', label: 'SLA Policies', icon: Sliders },
    { id: 'escalations', label: 'Escalations & Audit', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Problem ID */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">SLA Tracker</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  HACK-P368
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Real-Time SLA Engine & Workload Ops</p>
            </div>
          </div>

          {/* Engine Status indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px]">Engine Active</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Reseed + User Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Reseed Button */}
          <button
            onClick={onReseed}
            disabled={isReseeding}
            title="Reset database with sample tickets across On Track, At Risk, and Breached states"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${isReseeding ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Demo Data</span>
          </button>

          {/* User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-left transition-all"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-white">
                  {currentUser?.name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight">{currentUser?.name || 'Select User'}</div>
                <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                  <span>{currentUser?.role || 'agent'}</span>
                  <span>•</span>
                  <span>{currentUser?.team || 'General'}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Active User</span>
                  <Sparkles className="w-3 h-3 text-brand-400" />
                </div>
                <div className="py-1 max-h-72 overflow-y-auto space-y-1">
                  {users.map((u) => {
                    const isSelected = currentUser?._id === u._id;
                    return (
                      <button
                        key={u._id}
                        onClick={() => {
                          setCurrentUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                          isSelected ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                            {u.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {u.role} — {u.team}
                          </div>
                        </div>
                        {isSelected && <UserCheck className="w-4 h-4 text-brand-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-slate-950 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium ${
                active ? 'text-brand-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
