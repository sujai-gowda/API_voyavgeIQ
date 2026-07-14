import React from 'react';
import { Star, MapPin, ShieldCheck, Dumbbell, Wifi, Coffee, Compass } from 'lucide-react';

export default function HotelCard({ hotel, onCompare, isCompared }) {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getAmenityIcon = (name) => {
    const clean = name.toLowerCase();
    if (clean.includes('wifi'))      return <Wifi      className="h-3 w-3" />;
    if (clean.includes('pool'))      return <Compass   className="h-3 w-3" />;
    if (clean.includes('gym'))       return <Dumbbell  className="h-3 w-3" />;
    if (clean.includes('breakfast')) return <Coffee    className="h-3 w-3" />;
    return <Star className="h-3 w-3" />;
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-dark-700 shadow-sm hover:shadow-md hover:border-accent-400/30 transition-all duration-300 flex flex-col md:flex-row gap-0 relative">

      {/* AI Score Badge */}
      {hotel.score && (
        <div className={`absolute top-0 right-0 z-10 rounded-bl-xl border-l border-b px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${getScoreColor(hotel.score)}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Value Score: {hotel.score}</span>
        </div>
      )}

      {/* Hotel Image */}
      <div className="w-full md:w-52 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
        <img
          src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {/* Very subtle bottom fade for image-to-card blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 md:bg-gradient-to-r"></div>
      </div>

      {/* Hotel Specs */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div>
          {/* Type badge + Stars */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-dark-950 text-dark-400 px-2 py-0.5 rounded-md border border-dark-700">
              Hotel Stay
            </span>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-bold text-dark-100">{hotel.rating.toFixed(1)}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-dark-100 leading-tight mb-1">{hotel.name}</h3>

          <div className="flex items-center gap-1.5 text-xs text-dark-300 mb-4">
            <MapPin className="h-3.5 w-3.5 text-dark-300" />
            <span>{hotel.distance.toFixed(1)} km from city center</span>
          </div>

          {/* Amenity Badges */}
          <div className="flex flex-wrap gap-1.5">
            {hotel.amenities.map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] bg-dark-950 border border-dark-700 text-dark-300 px-2 py-1 rounded-md font-semibold"
              >
                {getAmenityIcon(amenity)}
                <span>{amenity}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Pricing / Compare */}
        <div className="flex items-center justify-between border-t border-dark-700 pt-4">
          <div>
            <p className="text-[10px] text-dark-300 uppercase tracking-wide font-medium">via {hotel.provider}</p>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-dark-300 select-none hover:text-dark-100 transition-colors mt-1 font-medium">
              <input
                type="checkbox"
                checked={isCompared}
                onChange={() => onCompare(hotel)}
                className="rounded border-dark-700 text-accent-400 focus:ring-accent-400 focus:ring-offset-0 h-4 w-4"
              />
              <span>Compare Stays</span>
            </label>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-dark-300 uppercase tracking-wide font-medium">per night</p>
            <p className="text-2xl font-black text-accent-400">₹{hotel.price.toLocaleString()}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
