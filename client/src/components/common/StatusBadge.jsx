import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, PlayCircle, Lock } from 'lucide-react';

export default function StatusBadge({ status, type = 'tournament' }) {
  let badgeStyle = 'bg-white/10 text-slate-300 border-white/15';
  let icon = null;
  let label = status;

  if (type === 'tournament') {
    switch (status) {
      case 'published':
        badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        icon = <PlayCircle className="w-3.5 h-3.5" />;
        label = 'Registration Open';
        break;
      case 'draft':
        badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        icon = <AlertCircle className="w-3.5 h-3.5" />;
        label = 'Draft';
        break;
      case 'registration_closed':
        badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        icon = <Lock className="w-3.5 h-3.5" />;
        label = 'Registration Closed';
        break;
      case 'completed':
        badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        label = 'Completed';
        break;
      default:
        label = status;
    }
  } else if (type === 'registration') {
    switch (status) {
      case 'pending':
        badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        icon = <Clock className="w-3.5 h-3.5" />;
        label = 'Pending Review';
        break;
      case 'accepted':
        badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        label = 'Accepted';
        break;
      case 'rejected':
        badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        icon = <XCircle className="w-3.5 h-3.5" />;
        label = 'Rejected';
        break;
      default:
        label = status;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${badgeStyle}`}>
      {icon}
      {label}
    </span>
  );
}
