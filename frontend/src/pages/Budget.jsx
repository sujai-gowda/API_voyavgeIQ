import React, { useState } from 'react';
import { IndianRupee, Sparkles, AlertCircle, Compass, Plane, Key, HelpCircle, Check, HelpCircle as Train } from 'lucide-react';
import { travelApi } from '../services/api';

export default function Budget() {
  const [formData, setFormData] = useState({
    from: 'Bangalore',
    to: 'Goa',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: 35000,
    travelers: 1
  });
  
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSliderChange = (e) => {
    setFormData(prev => ({ ...prev, budget: Number(e.target.value) }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await travelApi.getBudgetPlan(formData);
      setPackages(res.packages || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-dark-100 tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent-400" />
          <span>AI Budget Planner & Optimizer</span>
        </h1>
        <p className="text-xs text-dark-400">Assemble optimal combinations of transportation and lodging matching your exact budget</p>
      </div>

      {/* Input panel */}
      <div className="bg-white border border-dark-700 rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5 text-xs text-dark-400">
            <span className="font-bold">Leaving From</span>
            <input
              type="text"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="w-full bg-white border border-dark-700 rounded-xl px-3 py-2 text-dark-100 focus:outline-none focus:border-accent-400"
            />
          </div>

          <div className="space-y-1.5 text-xs text-dark-400">
            <span className="font-bold">Destination</span>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full bg-white border border-dark-700 rounded-xl px-3 py-2 text-dark-100 focus:outline-none focus:border-accent-400"
            />
          </div>

          <div className="space-y-1.5 text-xs text-dark-400">
            <span className="font-bold">Travelers</span>
            <input
              type="number"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) || 1 })}
              min="1"
              className="w-full bg-white border border-dark-700 rounded-xl px-3 py-2 text-dark-100 focus:outline-none focus:border-accent-400"
            />
          </div>

          {/* Budget Limit */}
          <div className="space-y-1.5 text-xs text-dark-400">
            <div className="flex justify-between font-bold">
              <span>Budget Cap</span>
              <span className="text-accent-400">₹{formData.budget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="5000"
              value={formData.budget}
              onChange={handleSliderChange}
              className="w-full accent-accent-400 h-1 rounded-lg bg-dark-955 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-400 hover:bg-accent-500 text-white font-bold text-xs py-3 rounded-xl tracking-wide transition-all shadow-md shadow-accent-400/20"
          >
            {loading ? 'OPTIMIZING...' : 'GENERATE PACKAGES'}
          </button>
        </form>
      </div>

      {/* Packages Output */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="spinner"></div>
          <p className="text-xs text-dark-400">Running AI optimization solvers on hotel rates and flight options...</p>
        </div>
      )}

      {!loading && searched && packages.length === 0 && (
        <div className="text-center py-20 space-y-2 border border-dashed border-dark-700 rounded-2xl bg-dark-950">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-dark-100">No packages could be resolved</h3>
          <p className="text-xs text-dark-400">Try adjusting your budget limit upwards or modifying the route constraints.</p>
        </div>
      )}

      {!loading && searched && packages.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => {
            const exceeds = pkg.totalCost > formData.budget;
            return (
              <div 
                key={idx} 
                className={`bg-white rounded-3xl p-6 border relative flex flex-col justify-between h-[480px] overflow-hidden shadow-sm ${
                  exceeds 
                    ? 'border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.03)]' 
                    : 'border-accent-400/20 shadow-[0_0_20px_rgba(0,168,107,0.03)]'
                }`}
              >
                
                {/* AI Score Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-black text-dark-100">{pkg.name}</h3>
                    <p className="text-[10px] text-dark-400 mt-0.5 leading-snug">{pkg.description}</p>
                  </div>
                  
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${getScoreColor(pkg.score)}`}>
                    Score: {pkg.score}
                  </span>
                </div>

                {/* Package Components */}
                <div className="space-y-4 flex-1 py-4 border-t border-b border-dark-700 my-4">
                  {/* Transport component */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-dark-955 border border-dark-700 flex items-center justify-center text-dark-400 flex-shrink-0">
                      <Plane className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <span className="text-[9px] uppercase font-bold text-dark-400 block">Transportation ({pkg.transport?.type || 'Transit'})</span>
                      <span className="text-dark-100 font-bold">{pkg.transport?.carrier || pkg.transport?.name || 'Unknown Carrier'}</span>
                      <p className="text-[10px] text-dark-400 mt-0.5">Price: ₹{pkg.transport?.price.toLocaleString()} • {pkg.transport?.stops === 0 ? 'Direct' : '1 stop'}</p>
                    </div>
                  </div>

                  {/* Hotel Stay component */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-dark-955 border border-dark-700 flex items-center justify-center text-accent-400 flex-shrink-0">
                      <Key className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <span className="text-[9px] uppercase font-bold text-dark-400 block">Lodging (3 Nights)</span>
                      <span className="text-dark-100 font-bold truncate block max-w-[180px]">{pkg.hotel?.name || 'Standard Accommodation'}</span>
                      <p className="text-[10px] text-dark-400 mt-0.5">Price: ₹{pkg.hotel?.price.toLocaleString()}/night • Dist: {pkg.hotel?.distance} km</p>
                    </div>
                  </div>

                  {/* Activities summary */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-dark-955 border border-dark-700 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <span className="text-[9px] uppercase font-bold text-dark-400 block">Sightseeing Activities</span>
                      <span className="text-dark-100 font-semibold">Included Local Explorer Access</span>
                      <p className="text-[10px] text-dark-400 mt-0.5">Curated points of interest via TripAdvisor</p>
                    </div>
                  </div>
                </div>

                {/* Pricing & Selection Button */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] text-dark-400 uppercase block font-bold">Total Estimated Cost</span>
                      <span className="text-2xl font-black text-accent-400">₹{pkg.totalCost.toLocaleString()}</span>
                    </div>

                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                      exceeds 
                        ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' 
                        : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                    }`}>
                      {exceeds ? (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Exceeds Budget</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Within Budget</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={exceeds}
                    className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all ${
                      exceeds
                        ? 'bg-dark-950 border border-dark-700 text-dark-400 cursor-not-allowed'
                        : 'bg-brand-600 hover:bg-brand-700 text-white-force border border-dark-700'
                    }`}
                  >
                    SELECT PLAN
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
