import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'purple', subtitle }) {
  const iconStyles = {
    purple: 'bg-violet-50 text-violet-600 border-violet-200',
    cyan: 'bg-sky-50 text-sky-600 border-sky-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200'
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${iconStyles[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
