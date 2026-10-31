import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LiveCountdown({
  dueDate,
  completedAt = null,
  createdDate,
  type = 'Response', // 'Response' | 'Resolution'
  compact = false,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Only tick if not completed
    if (completedAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [completedAt]);

  const due = new Date(dueDate).getTime();
  const created = createdDate ? new Date(createdDate).getTime() : due - 60 * 60 * 1000;
  const completed = completedAt ? new Date(completedAt).getTime() : null;

  // Total window duration in ms
  const totalDuration = Math.max(1000, due - created);

  // If already completed:
  if (completed) {
    const isMet = completed <= due;
    const diffMs = Math.abs(completed - due);
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    const timeFormatted = diffHours > 0 ? `${diffHours}h ${remainingMins}m` : `${diffMins}m`;

    return (
      <div className={`flex items-center gap-1.5 ${isMet ? 'text-emerald-400' : 'text-rose-400'} text-xs font-medium`}>
        {isMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
        <span>
          {type} {isMet ? 'Met' : 'Missed by ' + timeFormatted}
        </span>
      </div>
    );
  }

  // Active countdown
  const diffMs = due - now;
  const isOverdue = diffMs <= 0;
  const absDiffMs = Math.abs(diffMs);

  const totalSeconds = Math.floor(absDiffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Percentage elapsed (0 to 100)
  const elapsedMs = now - created;
  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDuration) * 100)));

  // Risk state: At risk if remaining <= 20% or less than 15 mins
  const isAtRisk = !isOverdue && (diffMs <= 0.2 * totalDuration || diffMs <= 15 * 60 * 1000);

  // Formatting
  let timeString = '';
  if (hours > 0) {
    timeString = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    timeString = `${minutes}m ${seconds}s`;
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Clock
            className={`w-3.5 h-3.5 ${
              isOverdue ? 'text-rose-400 animate-pulse' : isAtRisk ? 'text-amber-400' : 'text-emerald-400'
            }`}
          />
          <span
            className={
              isOverdue
                ? 'text-rose-400 font-semibold'
                : isAtRisk
                ? 'text-amber-400 font-medium'
                : 'text-slate-300'
            }
          >
            {isOverdue ? `-${timeString}` : timeString}
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverdue ? 'bg-rose-500' : isAtRisk ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isOverdue
          ? 'bg-rose-500/10 border-rose-500/30'
          : isAtRisk
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-slate-800/50 border-slate-700/50'
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-400 font-medium">{type} Target</span>
        <span
          className={`font-semibold font-mono ${
            isOverdue
              ? 'text-rose-400'
              : isAtRisk
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {isOverdue ? `Overdue by ${timeString}` : `${timeString} left`}
        </span>
      </div>

      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOverdue ? 'bg-rose-500' : isAtRisk ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentElapsed}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Due: {new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{percentElapsed}% elapsed</span>
      </div>
    </div>
  );
}
