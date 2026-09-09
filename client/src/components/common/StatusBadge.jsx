import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, PlayCircle, Lock } from 'lucide-react';

export default function StatusBadge({ status, type = 'tournament' }) {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = null;
  let label = status;

  if (type === 'tournament') {
    switch (status) {
      case 'published':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        icon = <PlayCircle className="w-3.5 h-3.5" />;
        label = 'Registration Open';
        break;
      case 'draft':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        icon = <AlertCircle className="w-3.5 h-3.5" />;
        label = 'Draft';
        break;
      case 'registration_closed':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        icon = <Lock className="w-3.5 h-3.5" />;
        label = 'Registration Closed';
        break;
      case 'completed':
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        label = 'Completed';
        break;
      default:
        label = status;
    }
  } else if (type === 'registration') {
    switch (status) {
      case 'pending':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        icon = <Clock className="w-3.5 h-3.5" />;
        label = 'Pending Review';
        break;
      case 'accepted':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        label = 'Accepted';
        break;
      case 'rejected':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        icon = <XCircle className="w-3.5 h-3.5" />;
        label = 'Rejected';
        break;
      default:
        label = status;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${badgeStyle}`}>
      {icon}
      {label}
    </span>
  );
}
