import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function SLABadge({ status, size = 'md', showIcon = true }) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  let config = {
    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
    label: 'On Track',
  };

  if (status === 'At Risk') {
    config = {
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse-subtle',
      dot: 'bg-amber-400 animate-ping-slow',
      icon: AlertTriangle,
      label: 'At Risk',
    };
  } else if (status === 'Breached') {
    config = {
      bg: 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-950/50',
      dot: 'bg-rose-500 animate-pulse',
      icon: AlertOctagon,
      label: 'Breached',
    };
  }

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${config.bg} ${
        isSmall ? 'px-2 py-0.5 text-xs' : isLarge ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <Icon className={isSmall ? 'w-3 h-3' : isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
}
