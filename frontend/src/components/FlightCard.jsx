import React from 'react';
import { Plane, Clock, ShieldCheck } from 'lucide-react';

export default function FlightCard({ flight, onCompare, isCompared }) {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
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
    <div className="bg-white rounded-2xl p-5 border border-dark-700 shadow-sm hover:shadow-md hover:border-accent-400/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">

      {/* AI Score Badge */}
      {flight.score && (
        <div className={`absolute top-0 right-0 rounded-bl-xl border-l border-b px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${getScoreColor(flight.score)}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Value Score: {flight.score}</span>
        </div>
      )}

      {/* Flight Details */}
      <div className="flex-1 flex items-center gap-4">
        {/* Carrier Icon */}
        <div className="h-12 w-12 rounded-xl bg-dark-950 border border-dark-700 flex items-center justify-center text-dark-100 flex-shrink-0">
          <Plane className="h-5 w-5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <div>
            <h4 className="font-bold text-dark-100 text-sm">{flight.carrier}</h4>
            <p className="text-xs text-dark-300">{flight.flightNumber}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-dark-100">{formatTime(flight.departureTime)}</p>
            <p className="text-[10px] text-dark-300 uppercase tracking-wide font-medium">Departure</p>
          </div>
          <div>
            <p className="text-sm font-bold text-dark-100">{formatTime(flight.arrivalTime)}</p>
            <p className="text-[10px] text-dark-300 uppercase tracking-wide font-medium">Arrival</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-dark-300 font-medium">
              <Clock className="h-3.5 w-3.5 text-dark-300" />
              <span>{formatDuration(flight.duration)}</span>
            </div>
            <p className="text-[10px] text-dark-300 mt-0.5">
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing and Action */}
      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end border-t md:border-t-0 md:border-l border-dark-700 pt-4 md:pt-0 md:pl-6 gap-4">
        <div>
          <p className="text-[10px] text-dark-300 uppercase tracking-wide text-left md:text-right font-medium">Price</p>
          <p className="text-xl font-black text-accent-400">₹{flight.price.toLocaleString()}</p>
          <span className="text-[10px] text-dark-300">via {flight.provider}</span>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-dark-300 select-none hover:text-dark-100 transition-colors font-medium">
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onCompare(flight)}
            className="rounded border-dark-700 text-accent-400 focus:ring-accent-400 focus:ring-offset-0 h-4 w-4"
          />
          <span>Compare</span>
        </label>
      </div>

    </div>
  );
}
