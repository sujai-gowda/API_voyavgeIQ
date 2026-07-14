import React, { useState, useEffect } from 'react';
import { Compass, Database, Bot, RefreshCw } from 'lucide-react';
import { travelApi } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [dbStatus, setDbStatus] = useState({ connected: false, cacheCount: 0 });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const stats = await travelApi.getCacheStats();
      setDbStatus({
        connected: stats.mongodbConnected,
        cacheCount: stats.mongoCacheItems + stats.inMemoryCacheItems
      });
    } catch (e) {
      setDbStatus({ connected: false, cacheCount: 0 });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await travelApi.clearCache();
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-dark-700 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-600/10">
              <Compass className="h-5 w-5 text-white-force animate-spin-slow" />
            </div>
            <div>
              <span className="font-sans text-xl font-bold tracking-tight text-dark-100">Voyage<span className="text-accent-400">IQ</span></span>
              <p className="text-[9px] tracking-wider text-dark-400 uppercase font-bold">AI Decision Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'landing' 
                  ? 'bg-accent-100 text-accent-400 shadow-sm' 
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-950'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-accent-100 text-accent-400 shadow-sm'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-950'
              }`}
            >
              Results
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-accent-100 text-accent-400 shadow-sm'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-950'
              }`}
            >
              Compare Cities
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'budget'
                  ? 'bg-accent-100 text-accent-400 shadow-sm'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-950'
              }`}
            >
              AI Budget Planner
            </button>
          </div>

          {/* Cache / System Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-dark-700 bg-dark-950 px-3 py-1.5 text-xs text-dark-400">
              <Database className="h-3.5 w-3.5 text-dark-400" />
              <span>Cache items: <strong className="text-dark-100 font-bold">{dbStatus.cacheCount}</strong></span>
              <span className={`inline-block h-2 w-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 shadow-[0_0_8px_#00A86B]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></span>
              <span>{dbStatus.connected ? 'MongoDB' : 'In-Memory'}</span>
            </div>

            <button
              onClick={handleClearCache}
              disabled={loading}
              title="Clear cache"
              className="p-2 text-dark-400 rounded-lg hover:bg-dark-950 hover:text-dark-100 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
