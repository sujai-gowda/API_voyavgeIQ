import React, { useState } from 'react';
import { Sun, CheckCircle, ShieldCheck, MapPin, X } from 'lucide-react';

export default function Compare() {
  const [selectedCities, setSelectedCities] = useState(['Goa', 'Tokyo', 'Dubai']);

  const destinationDatabase = {
    Goa: {
      country: 'India',
      weather: '29°C, Sunny',
      cost: '₹4,500 / day',
      safety: '9.0 / 10',
      crowd: 'Moderate to High',
      season: 'November to February',
      attractions: ['Calangute Beach', 'Basilica of Bom Jesus', 'Fort Aguada'],
      rating: 4.5
    },
    Tokyo: {
      country: 'Japan',
      weather: '18°C, Clear',
      cost: '₹15,000 / day',
      safety: '9.8 / 10',
      crowd: 'Very High',
      season: 'March to May (Spring)',
      attractions: ['Shibuya Crossing', 'Senso-ji Temple', 'Meiji Shrine'],
      rating: 4.9
    },
    Dubai: {
      country: 'UAE',
      weather: '36°C, Hot',
      cost: '₹12,000 / day',
      safety: '9.5 / 10',
      crowd: 'High',
      season: 'November to March',
      attractions: ['Burj Khalifa', 'Dubai Mall', 'Desert Safari'],
      rating: 4.7
    },
    Paris: {
      country: 'France',
      weather: '20°C, Partly Cloudy',
      cost: '₹14,000 / day',
      safety: '8.2 / 10',
      crowd: 'Very High',
      season: 'April to June',
      attractions: ['Eiffel Tower', 'Louvre Museum', 'Montmartre'],
      rating: 4.6
    },
    Singapore: {
      country: 'Singapore',
      weather: '31°C, Humid Rain',
      cost: '₹11,000 / day',
      safety: '9.7 / 10',
      crowd: 'High',
      season: 'February to April',
      attractions: ['Gardens by the Bay', 'Sentosa Island', 'Marina Bay Sands'],
      rating: 4.8
    },
    Delhi: {
      country: 'India',
      weather: '32°C, Sunny Haze',
      cost: '₹3,500 / day',
      safety: '7.5 / 10',
      crowd: 'Extremely High',
      season: 'October to March',
      attractions: ['Red Fort', 'Qutub Minar', 'India Gate'],
      rating: 4.2
    }
  };

  const handleToggleCity = (city) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length > 2) {
        setSelectedCities(selectedCities.filter(c => c !== city));
      }
    } else {
      if (selectedCities.length < 4) {
        setSelectedCities([...selectedCities, city]);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-dark-100 tracking-tight">Trip Comparison Mode</h1>
        <p className="text-xs text-dark-400">Compare destination safety, crowd level, weather, and average costs side-by-side</p>
      </div>

      {/* Selectors */}
      <div className="bg-white border border-dark-700 rounded-2xl p-4 shadow-sm flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-dark-400 mr-2">Toggle Cities (Select 2-4):</span>
        {Object.keys(destinationDatabase).map(city => {
          const isSelected = selectedCities.includes(city);
          return (
            <button
              key={city}
              onClick={() => handleToggleCity(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isSelected 
                  ? 'border-accent-400 bg-accent-100 text-accent-400 shadow-sm' 
                  : 'border-dark-700 bg-white text-dark-300 hover:text-dark-100'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedCities.map((city) => {
          const data = destinationDatabase[city];
          if (!data) return null;
          
          return (
            <div key={city} className="bg-white rounded-2xl p-5 border border-dark-700 flex flex-col justify-between h-[450px] relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 h-24 w-24 bg-accent-100/40 blur-xl group-hover:bg-accent-100/60 rounded-full transition-all"></div>
              
              <div>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-dark-700 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] text-accent-400 uppercase font-black tracking-widest">{data.country}</span>
                    <h3 className="text-xl font-black text-dark-100">{city}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    <span>★ {data.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-4 text-xs">
                  {/* Weather */}
                  <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                    <span className="text-dark-400">Weather & Temp</span>
                    <span className="text-dark-100 font-semibold flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
                      <span>{data.weather}</span>
                    </span>
                  </div>
                  
                  {/* Daily cost */}
                  <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                    <span className="text-dark-400">Average Daily Cost</span>
                    <span className="text-accent-400 font-black text-sm">{data.cost}</span>
                  </div>

                  {/* Safety */}
                  <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                    <span className="text-dark-400">Safety Index</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{data.safety}</span>
                    </span>
                  </div>

                  {/* Crowd density */}
                  <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                    <span className="text-dark-400">Crowd Density</span>
                    <span className="text-dark-100 font-semibold">{data.crowd}</span>
                  </div>

                  {/* Season */}
                  <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                    <span className="text-dark-400">Recommended Months</span>
                    <span className="text-dark-100 font-semibold">{data.season}</span>
                  </div>
                </div>
              </div>

              {/* Attractions Footer */}
              <div className="pt-4 border-t border-dark-700 bg-dark-950 -mx-5 -mb-5 p-5 rounded-b-2xl">
                <span className="text-[10px] uppercase text-dark-400 font-black tracking-widest block mb-2">Key Sights & Spots</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.attractions.map((attr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-white border border-dark-700 text-[10px] text-dark-100 px-2.5 py-1 rounded-md"
                    >
                      <MapPin className="h-2.5 w-2.5 text-dark-400" />
                      <span>{attr}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
