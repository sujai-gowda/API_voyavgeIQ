import React from 'react';
import { Compass, Clock, ShieldCheck } from 'lucide-react';

export default function TrainCard({ train, onCompare, isCompared }) {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getAvailColor = (avail) => {
    if (avail.includes('Available')) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (avail.includes('RAC')) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const formatDuration = (mins) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs}h ${m}m`;
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
      
      {/* AI Score Badge */}
      {train.score && (
        <div className={`absolute top-0 right-0 rounded-bl-xl border-l border-b px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${getScoreColor(train.score)}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Value Score: {train.score}</span>
        </div>
      )}

      {/* Train Details */}
      <div className="flex-1 flex items-center gap-4">
        {/* Train icon container */}
        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sky-500 flex-shrink-0">
          <Compass className="h-6 w-6 rotate-45" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{train.name}</h4>
            <p className="text-xs text-slate-500">Train #{train.trainNumber}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{formatTime(train.departureTime)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Departure</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{formatTime(train.arrivalTime)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Arrival</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              <span>{formatDuration(train.duration)}</span>
            </div>
            <span className={`inline-block text-[10px] border px-2 py-0.5 rounded-full mt-1 font-medium ${getAvailColor(train.availability)}`}>
              {train.availability}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing and Actions */}
      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide text-left md:text-right">Ticket Fare</p>
          <p className="text-xl font-black text-sky-500">₹{train.price.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">via {train.provider}</span>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 select-none hover:text-slate-900 transition-colors">
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onCompare(train)}
            className="rounded border-slate-300 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 h-4 w-4"
          />
          <span>Compare</span>
        </label>
      </div>

    </div>
  );
}
