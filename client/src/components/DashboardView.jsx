import React from 'react';
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import SLABadge from './SLABadge';
import LiveCountdown from './LiveCountdown';

export default function DashboardView({
  metrics,
  loading,
  onSelectTicket,
  onNavigateToTickets,
}) {
  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Aggregating SLA metrics and workload statistics...</p>
      </div>
    );
  }

  const {
    totalTickets = 0,
    totalOpenTickets = 0,
    slaBreaches = { count: 0, percentage: 0 },
    atRiskTicketsCount = 0,
    onTrackTicketsCount = 0,
    complianceRate = 100,
    averageFirstResponseTimeMinutes = 0,
    averageResolutionTimeMinutes = 0,
    workloadByTeam = {},
    workloadByAgent = [],
    urgentTickets = [],
  } = metrics || {};

  // Format minutes to readable string (e.g. 1h 15m)
  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner: Real-Time SLA Health & Compliance */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-brand-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-brand-950/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span>SLA Performance Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Customer Support Operations & Health
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Live automated tracking of response and resolution thresholds based on configured SLA policies.
            </p>
          </div>

          {/* Compliance Meter */}
          <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={163.36}
                  strokeDashoffset={163.36 - (163.36 * complianceRate) / 100}
                  className={
                    complianceRate >= 90
                      ? 'text-emerald-500'
                      : complianceRate >= 75
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-bold text-sm text-white font-mono">{complianceRate}%</span>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">SLA Compliance</div>
              <div className="text-sm font-semibold text-white">
                {complianceRate >= 90 ? 'Healthy SLA Tier' : complianceRate >= 75 ? 'Attention Required' : 'Critical Breach Rate'}
              </div>
              <div className="text-[11px] text-slate-500">
                {totalTickets - slaBreaches.count} of {totalTickets} tickets within targets
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Open */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono">{totalOpenTickets}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-slate-300 font-medium">{totalTickets}</span>
            <span>total tickets tracked</span>
          </div>
        </div>

        {/* On Track */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">On Track</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{onTrackTicketsCount}</div>
          <div className="text-xs text-slate-400 mt-2">Meeting SLA commitments</div>
        </div>

        {/* At Risk */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">At Risk</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{atRiskTicketsCount}</div>
          <div className="text-xs text-slate-400 mt-2">{"< 20%"} SLA window remaining</div>
        </div>

        {/* SLA Breaches */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Breaches</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-400 font-mono">{slaBreaches.count}</div>
          <div className="text-xs text-rose-400/80 mt-2 font-medium">
            {slaBreaches.percentage}% breach rate
          </div>
        </div>

        {/* Avg Times */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Times</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">First Resp:</span>
              <span className="text-white font-mono font-semibold">{formatMinutes(averageFirstResponseTimeMinutes)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Resolution:</span>
              <span className="text-white font-mono font-semibold">{formatMinutes(averageResolutionTimeMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Radar + Team Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Radar / Breached & At Risk Feed (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Urgent Attention Radar</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active tickets that require immediate agent response or resolution
              </p>
            </div>
            <button
              onClick={() => onNavigateToTickets({ slaStatus: 'Breached' })}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View all at-risk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentTickets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-slate-300">All Clear! No Active Breaches</div>
              <p className="text-xs text-slate-500 mt-1">All tickets are currently within acceptable SLA limits.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => onSelectTicket(ticket._id)}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-400">{ticket.ticketNumber}</span>
                      <SLABadge status={ticket.slaStatus} size="sm" />
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                          ticket.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-slate-400 truncate max-w-[140px]">
                        {ticket.customerReference}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                      {ticket.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Team: {ticket.assignedTeam}</span>
                      <span>•</span>
                      <span>Agent: {ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="sm:w-44 flex flex-col items-end justify-center">
                    {!ticket.firstResponseAt ? (
                      <LiveCountdown
                        dueDate={ticket.firstResponseDue}
                        type="Response"
                        compact={true}
                      />
                    ) : (
                      <LiveCountdown
                        dueDate={ticket.resolutionDue}
                        type="Resolution"
                        compact={true}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Workload Distribution (1 col) */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              <span>Team Workload & Breaches</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Ticket volume and health per operational team</p>
          </div>

          <div className="space-y-4">
            {Object.entries(workloadByTeam).map(([teamName, data]) => {
              const total = data.total || 1;
              const onTrackPct = Math.round((data.onTrack / total) * 100);
              const atRiskPct = Math.round((data.atRisk / total) * 100);
              const breachedPct = Math.round((data.breached / total) * 100);

              return (
                <div key={teamName} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-white">{teamName}</span>
                    <span className="font-mono text-slate-400">{data.open} open ({data.total} total)</span>
                  </div>

                  {/* Multi-segment progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex mb-2">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${onTrackPct}%` }}
                      title={`On Track: ${data.onTrack}`}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${atRiskPct}%` }}
                      title={`At Risk: ${data.atRisk}`}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${breachedPct}%` }}
                      title={`Breached: ${data.breached}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400">{data.onTrack} on track</span>
                    <span className="text-amber-400">{data.atRisk} at risk</span>
                    <span className="text-rose-400">{data.breached} breached</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Workload Distribution */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              <span>Agent Performance & Active Workloads</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Individual capacity and active SLA breach exposure</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {workloadByAgent.map((agent) => (
            <div
              key={agent.agentId || 'unassigned'}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center hover:border-slate-700 transition-all"
            >
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-12 h-12 rounded-full object-cover mb-2 border border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 mb-2">
                  {agent.name[0]}
                </div>
              )}
              <div className="font-semibold text-xs text-white truncate max-w-full">{agent.name}</div>
              <div className="text-[10px] text-slate-400 mb-3">{agent.team}</div>

              <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-around text-xs">
                <div>
                  <div className="font-mono font-bold text-white">{agent.open}</div>
                  <div className="text-[10px] text-slate-500">Open</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-amber-400">{agent.atRisk}</div>
                  <div className="text-[10px] text-slate-500">At Risk</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-rose-400">{agent.breached}</div>
                  <div className="text-[10px] text-slate-500">Breached</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
