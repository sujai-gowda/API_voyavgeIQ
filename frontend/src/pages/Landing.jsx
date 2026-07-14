import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, IndianRupee, Flame, Compass, PlaneTakeoff, PlaneLanding, AlertCircle } from 'lucide-react';
import { searchIATA, lookupIATA } from '../services/iataData';

// ─── Autocomplete Airport Input ──────────────────────────────────────────────
function AirportInput({ label, icon: Icon, iconColor, value, onChange, placeholder, id }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync external value → internal query on first load
  useEffect(() => {
    if (value && query === '') setQuery(value);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedEntry(null);

    if (val.length >= 2) {
      const results = searchIATA(val);
      setSuggestions(results);
      setOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
    // Pass raw value up (parent can still accept it)
    onChange(val);
  };

  const handleSelect = (entry) => {
    setSelectedEntry(entry);
    setQuery(`${entry.city} (${entry.iata})`);
    setSuggestions([]);
    setOpen(false);
    onChange(entry.iata); // Send IATA code to parent
  };

  const handleBlur = () => {
    // On blur, try to resolve what was typed if not already selected
    setTimeout(() => {
      if (!selectedEntry && query.length >= 2) {
        const resolved = lookupIATA(query);
        if (resolved) {
          setSelectedEntry(resolved);
          setQuery(`${resolved.city} (${resolved.iata})`);
          onChange(resolved.iata);
        }
      }
      setOpen(false);
    }, 150);
  };

  const isValid = selectedEntry !== null || (query.length === 3 && /^[A-Z]{3}$/i.test(query));

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label htmlFor={id} className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <span>{label}</span>
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInput}
          onBlur={handleBlur}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 transition-all duration-200
            ${isValid
              ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
              : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
        />

        {/* IATA badge */}
        {selectedEntry && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-md tracking-wider">
            {selectedEntry.iata}
          </span>
        )}

        {/* Dropdown */}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((entry) => (
              <li
                key={entry.iata}
                onMouseDown={() => handleSelect(entry)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:bg-sky-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{entry.city}</p>
                  <p className="text-[10px] text-slate-400 truncate">{entry.airport} · {entry.country}</p>
                </div>
                <span className="flex-shrink-0 text-xs font-black text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md group-hover:bg-sky-100">
                  {entry.iata}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unrecognized warning */}
      {query.length > 2 && !selectedEntry && !open && (
        <p className="text-[10px] text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>City not found — you can type the 3-letter IATA code directly (e.g. BLR)</span>
        </p>
      )}
    </div>
  );
}

// ─── Main Landing Component ───────────────────────────────────────────────────
export default function Landing({ onSearch, loading }) {
  const [formData, setFormData] = useState({
    from: 'BLR',
    to: 'GOI',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD, 7 days ahead
    returnDate: '',
    travelers: 1,
    budget: 40000
  });

  const handleField = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (e) => {
    setFormData(prev => ({ ...prev, budget: Number(e.target.value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.from || !formData.to || !formData.date) return;
    onSearch(formData);
  };

  // Popular destinations map to IATA codes directly
  const popularDestinations = [
    { city: 'Goa',       iata: 'GOI', country: 'India',     img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80', description: 'Beaches & Shacks' },
    { city: 'Tokyo',     iata: 'NRT', country: 'Japan',     img: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=400&q=80', description: 'Neon & Culture' },
    { city: 'Dubai',     iata: 'DXB', country: 'UAE',       img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80', description: 'Skyline & Adventure' },
    { city: 'Paris',     iata: 'CDG', country: 'France',    img: 'https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?auto=format&fit=crop&w=400&q=80', description: 'Art & Romance' },
    { city: 'Singapore', iata: 'SIN', country: 'Singapore', img: 'https://images.unsplash.com/photo-1525596667371-29400c51576f?auto=format&fit=crop&w=400&q=80', description: 'Futuristic Gardens' },
  ];

  const selectPopular = (dest) => {
    const updated = { ...formData, to: dest.iata };
    setFormData(updated);
    onSearch(updated);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">

      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto py-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-200 bg-sky-50 text-xs text-sky-600 font-bold uppercase tracking-wider">
          <Flame className="h-3.5 w-3.5" />
          <span>Intelligent Travel Aggregation</span>
        </div>
        <h1 className="font-sans text-4xl sm:text-6xl font-black text-slate-900 leading-none tracking-tight">
          Travel Smarter. <br />
          <span className="text-gradient-purple-cyan">Decide Faster.</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
          Compare flights, hotels, trains, and destination safety in one smart workspace. Powered by multi-objective AI scoring.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/80 to-sky-50/30 rounded-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

          {/* Row 1: From / To / Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <AirportInput
              id="from-input"
              label="Leaving From"
              icon={PlaneTakeoff}
              iconColor="text-slate-400"
              value="Bengaluru (BLR)"
              placeholder="City or IATA code…"
              onChange={handleField('from')}
            />
            <AirportInput
              id="to-input"
              label="Destination"
              icon={PlaneLanding}
              iconColor="text-sky-500"
              value="Goa (GOI)"
              placeholder="City or IATA code…"
              onChange={handleField('to')}
            />

            {/* Date — always YYYY-MM-DD */}
            <div className="space-y-1.5">
              <label htmlFor="date-input" className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Departure Date</span>
              </label>
              <input
                id="date-input"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900
                  focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
              />
              {/* Show formatted date hint */}
              <p className="text-[10px] text-slate-400">Format: YYYY-MM-DD · {formData.date}</p>
            </div>
          </div>

          {/* Row 2: Travelers + Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Travelers */}
            <div className="space-y-1.5">
              <label htmlFor="travelers-input" className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Travelers</span>
              </label>
              <input
                id="travelers-input"
                type="number"
                name="travelers"
                value={formData.travelers}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900
                  focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>

            {/* Budget Slider */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-sky-500" />
                  <span>Max Budget</span>
                </span>
                <span className="text-sky-600 text-sm font-black">₹{formData.budget.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-slate-400">₹2k</span>
                <input
                  type="range"
                  min="2000"
                  max="150000"
                  step="2000"
                  value={formData.budget}
                  onChange={handleSliderChange}
                  className="flex-1 h-1.5 rounded-lg bg-slate-200 cursor-pointer accent-sky-500"
                />
                <span className="text-[10px] text-slate-400">₹150k</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Compass className="h-5 w-5 animate-spin text-white-force" />
                  <span className="text-white-force">AGGREGATING APIs…</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 group-hover:scale-110 transition-transform text-white-force" />
                  <span className="text-white-force">SEARCH DECISION STACK</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Popular Destinations */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Popular Destinations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click to pre-fill and instantly search</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {popularDestinations.map((dest, idx) => (
            <div
              key={idx}
              onClick={() => !loading && selectPopular(dest)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden relative h-56 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <img
                src={dest.img}
                alt={dest.city}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 brightness-[0.85] group-hover:brightness-[0.95]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* IATA badge */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-black bg-white/20 backdrop-blur-sm text-white border border-white/30 px-2 py-0.5 rounded-md tracking-widest">
                  {dest.iata}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">{dest.country}</span>
                <h4 className="text-base font-bold text-white leading-tight">{dest.city}</h4>
                <p className="text-[10px] text-neutral-300 mt-1 leading-snug group-hover:text-white transition-colors">{dest.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
