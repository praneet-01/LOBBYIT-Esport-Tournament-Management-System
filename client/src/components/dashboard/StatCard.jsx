import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'purple', subtitle }) {
  const iconStyles = {
    purple: 'bg-[#1F1218] text-[#E6002B] border-[#E6002B]/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  return (
    <div className="p-5 rounded-2xl bg-[#10141E] border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-gaming">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${iconStyles[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-tight">{value}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
