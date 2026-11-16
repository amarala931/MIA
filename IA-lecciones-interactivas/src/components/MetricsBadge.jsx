import React from 'react';

export default function MetricsBadge({ 
  label, 
  value, 
  unit = '', 
  status = 'neutral', // 'good' | 'warning' | 'danger' | 'neutral'
  subtitle = '',
  icon: Icon
}) {
  const statusStyles = {
    good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    danger: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    neutral: 'border-slate-700/60 bg-slate-800/50 text-slate-200'
  };

  const badgeColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    neutral: 'text-brand-400'
  };

  return (
    <div className={`p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 ${statusStyles[status]}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span className="font-medium tracking-wide uppercase text-[11px]">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${badgeColors[status]}`} />}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-xl font-bold font-mono tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
      </div>
      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  );
}
