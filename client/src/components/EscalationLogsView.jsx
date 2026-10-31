import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';

export default function EscalationLogsView({
  metrics,
  tickets = [],
  onSelectTicket,
}) {
  const escalations = metrics?.recentEscalations || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Escalation & Notification Audit Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of SLA threshold breaches, automated notifications, and simulated webhook alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Escalation Dispatcher: Active</span>
          </span>
        </div>
      </div>

      {/* Info Banner on Notification Simulation */}
      <div className="p-4 rounded-2xl glass-panel border border-brand-500/20 bg-brand-950/20 flex items-start gap-3 text-xs">
        <Zap className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-brand-300">Automated SLA Threshold Alerts</div>
          <p className="text-slate-300 leading-relaxed">
            When a ticket's remaining time drops below 20% or passes the target response/resolution deadline, the SLA calculation engine records an immutable threshold event and simulates outbound dispatch (PagerDuty incident creation, Ops Slack webhook, and email notification).
          </p>
        </div>
      </div>

      {/* Escalation Event Feed */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Incidents & Escalation Dispatches ({escalations.length})
          </span>
        </div>

        {escalations.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No escalation events recorded. All active tickets are currently adhering to SLA targets.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {escalations.map((esc, idx) => {
              const isBreached = esc.thresholdCrossed?.toLowerCase().includes('breached');
              return (
                <div
                  key={idx}
                  className="p-4 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isBreached
                            ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                            : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {isBreached ? (
                          <AlertOctagon className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        <span>{esc.thresholdCrossed}</span>
                      </span>

                      <button
                        onClick={() => onSelectTicket(esc.ticketId)}
                        className="font-mono text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                      >
                        <span>{esc.ticketNumber}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {esc.priority}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-white truncate">{esc.subject}</div>

                    <div className="text-xs text-slate-400">{esc.details}</div>
                  </div>

                  <div className="sm:text-right space-y-1 shrink-0">
                    <div className="text-xs font-mono text-slate-400">
                      {new Date(esc.timestamp).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium flex sm:justify-end items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simulated Webhook Sent</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
