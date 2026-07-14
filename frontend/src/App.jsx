import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Compare from './pages/Compare';
import Budget from './pages/Budget';
import ChatBot from './components/ChatBot';
import { travelApi } from './services/api';
import { X, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [searchParams, setSearchParams] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Side-by-side compare items state (within search results)
  const [comparedItems, setComparedItems] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const handleSearch = async (params) => {
    setLoading(true);
    setSearchParams(params);
    setActiveTab('dashboard'); // switch tab so loading shows in results
    try {
      const data = await travelApi.searchAll(params);
      setSearchData(data);
    } catch (error) {
      console.error('Error fetching travel data:', error);
    }
    setLoading(false);
  };

  const handleToggleCompare = (item) => {
    const exists = comparedItems.some(i => i.id === item.id);
    if (exists) {
      setComparedItems(comparedItems.filter(i => i.id !== item.id));
    } else {
      if (comparedItems.length >= 3) {
        alert('You can compare a maximum of 3 items at a time.');
        return;
      }
      setComparedItems([...comparedItems, item]);
    }
  };

  const clearComparedItems = () => {
    setComparedItems([]);
    setIsCompareModalOpen(false);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Pages Container */}
      <main className="flex-1 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
            <div className="spinner"></div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider text-center">Aggregating Global Stacks...</p>
              <p className="text-xs text-dark-400 text-center mt-1">Calling Flight, Hotel, Train and TripAdvisor APIs simultaneously</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'landing' && (
              <Landing onSearch={handleSearch} loading={loading} />
            )}
            
            {activeTab === 'dashboard' && (
              <Dashboard
                searchData={searchData}
                searchParams={searchParams}
                onCompare={handleToggleCompare}
                comparedItems={comparedItems}
                openCompareModal={() => setIsCompareModalOpen(true)}
              />
            )}

            {activeTab === 'compare' && <Compare />}

            {activeTab === 'budget' && <Budget />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-dark-950/40 py-6 text-center text-xs text-dark-500 mt-12">
        <p>© {new Date().getFullYear()} VoyageIQ Decision Engine. Built for smarter, unified travel searches.</p>
      </footer>

      {/* Floating AI Chat Assistant */}
      <ChatBot />

      {/* Side-by-Side Comparison Overlay Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white border border-dark-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark-700 px-6 py-4 bg-dark-950">
              <div>
                <h3 className="text-lg font-bold text-dark-100">Side-by-Side Comparison</h3>
                <p className="text-[10px] text-dark-400">Comparing selected travel options based on price, rating, and AI Score</p>
              </div>
              <button 
                onClick={() => setIsCompareModalOpen(false)}
                className="text-dark-400 hover:text-dark-100 p-1 rounded-lg hover:bg-dark-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-x-auto p-6 bg-dark-950">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[600px]">
                {comparedItems.map((item) => (
                  <div key={item.id} className="bg-white border border-dark-700 rounded-2xl p-5 flex flex-col justify-between h-[360px] shadow-sm">
                    <div>
                      {/* Badge / Type */}
                      <div className="flex justify-between items-start mb-3 border-b border-dark-700 pb-2">
                        <span className="text-[9px] uppercase font-bold text-accent-400 tracking-wider">
                          {item.type} • {item.provider}
                        </span>
                        
                        {item.score && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getScoreColor(item.score)}`}>
                            Score: {item.score}
                          </span>
                        )}
                      </div>

                      {/* Main Title/Header */}
                      <h4 className="text-sm font-bold text-dark-100 truncate mb-4">
                        {item.type === 'flight' && `${item.carrier} (${item.flightNumber})`}
                        {item.type === 'hotel' && item.name}
                        {item.type === 'train' && `${item.name} (#${item.trainNumber})`}
                      </h4>

                      {/* Item specific specs */}
                      <div className="space-y-2 text-xs text-dark-400">
                        {item.type === 'flight' && (
                          <>
                            <div className="flex justify-between border-b border-dark-700 pb-1">
                              <span>Stops:</span>
                              <span className="text-dark-100 font-bold">{item.stops === 0 ? 'Non-stop' : `${item.stops} stops`}</span>
                            </div>
                            <div className="flex justify-between border-b border-dark-700 pb-1">
                              <span>Duration:</span>
                              <span className="text-dark-100 font-bold">{Math.floor(item.duration / 60)}h {item.duration % 60}m</span>
                            </div>
                            <div className="flex justify-between pb-1">
                              <span>Seat Cabin:</span>
                              <span className="text-dark-100 font-bold">{item.seatClass}</span>
                            </div>
                          </>
                        )}

                        {item.type === 'hotel' && (
                          <>
                            <div className="flex justify-between border-b border-dark-700 pb-1">
                              <span>User Rating:</span>
                              <span className="text-amber-500 font-bold">★ {item.rating.toFixed(1)} / 5</span>
                            </div>
                            <div className="flex justify-between border-b border-dark-700 pb-1">
                              <span>Distance:</span>
                              <span className="text-dark-100 font-bold">{item.distance.toFixed(1)} km from center</span>
                            </div>
                            <div className="flex flex-col gap-1 pt-1">
                              <span className="text-[10px] text-dark-400">Amenities:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.amenities.slice(0, 3).map((a, i) => (
                                  <span key={i} className="bg-dark-950 px-1.5 py-0.5 rounded text-[9px] text-dark-300 border border-dark-700">{a}</span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {item.type === 'train' && (
                          <>
                            <div className="flex justify-between border-b border-dark-700 pb-1">
                              <span>Duration:</span>
                              <span className="text-dark-100 font-bold">{Math.floor(item.duration / 60)}h {item.duration % 60}m</span>
                            </div>
                            <div className="flex justify-between pb-1">
                              <span>Availability:</span>
                              <span className="text-emerald-500 font-bold">{item.availability}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing Row */}
                    <div className="pt-4 border-t border-dark-700">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[9px] text-dark-400 uppercase block font-bold">Cost</span>
                          <span className="text-xl font-black text-accent-400">₹{item.price.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => handleToggleCompare(item)}
                          className="text-[10px] text-rose-400 hover:underline hover:text-rose-500 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-dark-950 border-t border-dark-700 flex justify-between items-center">
              <button 
                onClick={clearComparedItems}
                className="text-xs text-dark-400 hover:text-dark-100 transition-colors font-semibold"
              >
                Clear comparison list
              </button>
              <button 
                onClick={() => setIsCompareModalOpen(false)}
                className="bg-brand-600 hover:bg-brand-700 text-white-force text-xs font-bold px-4 py-2 rounded-lg transition-all"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
