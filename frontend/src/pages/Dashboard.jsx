import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Sun, Calendar, Info, BarChart2, ShieldAlert, Sparkles, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FlightCard from '../components/FlightCard';
import HotelCard from '../components/HotelCard';
import TrainCard from '../components/TrainCard';
import { travelApi } from '../services/api';

export default function Dashboard({ searchData, searchParams, onCompare, comparedItems, openCompareModal }) {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('score');
  
  // Price Forecast State
  const [priceTrend, setPriceTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Filters State
  const [maxPriceFilter, setMaxPriceFilter] = useState(150000);
  const [selectedStops, setSelectedStops] = useState('all');
  
  useEffect(() => {
    if (searchData && searchData.flights && searchData.flights.length > 0) {
      fetchPricePrediction();
    }
  }, [searchData]);

  const fetchPricePrediction = async () => {
    setTrendLoading(true);
    try {
      const avgPrice = searchData.flights[0]?.price || 8000;
      const res = await travelApi.predictPriceTrend({
        from: searchParams.from,
        to: searchParams.to,
        date: searchParams.date,
        price: avgPrice
      });
      setPriceTrend(res);
    } catch (e) {
      console.error(e);
    }
    setTrendLoading(false);
  };

  if (!searchData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="h-12 w-12 rounded-full border border-dashed border-accent-400 animate-spin flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-accent-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-dark-100">No active search results</h3>
          <p className="text-xs text-dark-400">Head back to the Search tab to begin aggregating travel routes.</p>
        </div>
      </div>
    );
  }

  // AI Recommendation Highlights
  const cheapestFlight = [...searchData.flights].sort((a,b) => a.price - b.price)[0];
  const bestValueFlight = [...searchData.flights].sort((a,b) => b.score - a.score)[0];
  const fastestFlight = [...searchData.flights].sort((a,b) => a.duration - b.duration)[0];
  const luxuryHotel = [...searchData.hotels].sort((a,b) => b.price - a.price)[0];

  // Filters & Sorters Logic
  const getFilteredFlights = () => {
    let list = [...searchData.flights];
    if (selectedStops !== 'all') {
      const stops = parseInt(selectedStops, 10);
      list = list.filter(f => f.stops === stops);
    }
    list = list.filter(f => f.price <= maxPriceFilter);
    return sortList(list);
  };

  const getFilteredHotels = () => {
    let list = [...searchData.hotels];
    list = list.filter(h => h.price <= maxPriceFilter);
    return sortList(list);
  };

  const getFilteredTrains = () => {
    let list = [...searchData.trains];
    list = list.filter(t => t.price <= maxPriceFilter);
    return sortList(list);
  };

  const sortList = (list) => {
    if (sortOrder === 'score') return list.sort((a,b) => (b.score || 0) - (a.score || 0));
    if (sortOrder === 'price_asc') return list.sort((a,b) => a.price - b.price);
    if (sortOrder === 'duration_asc') return list.sort((a,b) => (a.duration || 0) - (b.duration || 0));
    if (sortOrder === 'rating_desc') return list.sort((a,b) => (b.rating || 0) - (a.rating || 0));
    return list;
  };

  const isItemCompared = (item) => {
    return comparedItems.some(i => i.id === item.id);
  };

  // Weather styling helper
  const getSafetyColor = (score) => {
    if (score >= 9.0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 8.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  // Recharts custom tooltip
  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-dark-700 p-3 rounded-lg text-xs shadow-md">
          <p className="text-dark-300 font-bold mb-1">{payload[0].payload.day}</p>
          <p className="text-accent-400 font-black">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // Prepare Recharts data
  const chartData = priceTrend?.trend?.prices.map((price, idx) => ({
    day: priceTrend.trend.labels[idx],
    Price: price
  })) || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Route Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-700 pb-6">
        <div>
          <div className="flex items-center gap-2 text-dark-100">
            <h1 className="text-2xl font-black tracking-tight">{searchParams.from}</h1>
            <ArrowRight className="h-4 w-4 text-dark-400" />
            <h1 className="text-2xl font-black tracking-tight text-accent-400">{searchParams.to}</h1>
          </div>
          <p className="text-xs text-dark-400 mt-1 flex items-center gap-2">
            <span>Departure: {new Date(searchParams.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span>•</span>
            <span>{searchParams.travelers} Travelers</span>
            <span>•</span>
            <span>Max Budget: ₹{searchParams.budget.toLocaleString()}</span>
          </p>
        </div>

        {/* Action button */}
        {comparedItems.length > 0 && (
          <button
            onClick={openCompareModal}
            className="flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-accent-400/20"
          >
            <Plus className="h-4 w-4 text-white-force" />
            <span className="text-white-force">Side-by-side Compare ({comparedItems.length})</span>
          </button>
        )}
      </div>

      {/* AI Recommendation Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {bestValueFlight && (
          <div className="bg-white border border-accent-400/30 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden shadow-sm">
            <span className="text-[9px] font-extrabold uppercase bg-accent-100 text-accent-400 border border-accent-400/20 px-2 py-0.5 rounded-md w-fit">
              Best Value Flight (AI)
            </span>
            <div>
              <p className="text-xs text-dark-300 font-semibold">{bestValueFlight.carrier}</p>
              <p className="text-lg font-black text-dark-100">₹{bestValueFlight.price.toLocaleString()}</p>
            </div>
            <span className="absolute bottom-4 right-4 text-xs font-black text-accent-400">Score: {bestValueFlight.score}</span>
          </div>
        )}
        {cheapestFlight && (
          <div className="bg-white border border-dark-700 rounded-2xl p-4 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase bg-accent-100 text-accent-400 border border-accent-400/20 px-2 py-0.5 rounded-md w-fit">
              Cheapest Flight
            </span>
            <div>
              <p className="text-xs text-dark-300 font-semibold">{cheapestFlight.carrier}</p>
              <p className="text-lg font-black text-dark-100">₹{cheapestFlight.price.toLocaleString()}</p>
            </div>
            <span className="text-[10px] text-dark-400">Non-stop</span>
          </div>
        )}
        {fastestFlight && (
          <div className="bg-white border border-dark-700 rounded-2xl p-4 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase bg-accent-100 text-accent-400 border border-accent-400/20 px-2 py-0.5 rounded-md w-fit">
              Fastest Flight
            </span>
            <div>
              <p className="text-xs text-dark-300 font-semibold">{fastestFlight.carrier}</p>
              <p className="text-lg font-black text-dark-100">₹{fastestFlight.price.toLocaleString()}</p>
            </div>
            <span className="text-[10px] text-dark-400">{Math.floor(fastestFlight.duration / 60)}h {fastestFlight.duration % 60}m</span>
          </div>
        )}
        {luxuryHotel && (
          <div className="bg-white border border-dark-700 rounded-2xl p-4 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md w-fit">
              Luxury Stay (5★)
            </span>
            <div>
              <p className="text-xs text-dark-300 truncate max-w-[150px] font-semibold">{luxuryHotel.name}</p>
              <p className="text-lg font-black text-dark-100">₹{luxuryHotel.price.toLocaleString()}/N</p>
            </div>
            <span className="text-[10px] text-dark-400">Rating: {luxuryHotel.rating.toFixed(1)}/5</span>
          </div>
        )}
      </div>

      {/* Main Grid: Filters Left, Charts/Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Sidebar Filters */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Filters card */}
          <div className="bg-white border border-dark-700 rounded-2xl p-5 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-dark-100">Filters</h3>
            
            {/* Price Filter */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-dark-400">
                <span>Max Price Limit</span>
                <span className="text-accent-400 font-bold">₹{maxPriceFilter.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="150000"
                step="2000"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-accent-400 h-1 rounded-lg bg-dark-950 cursor-pointer"
              />
            </div>

            {/* Flight Stops Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-dark-400">Flight Stops</span>
              <div className="flex gap-2">
                {['all', '0', '1'].map((stop) => (
                  <button
                    key={stop}
                    onClick={() => setSelectedStops(stop)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all ${
                      selectedStops === stop
                        ? 'border-accent-400 bg-accent-100 text-accent-400'
                        : 'border-dark-700 bg-white text-dark-300 hover:text-dark-100'
                    }`}
                  >
                    {stop === 'all' ? 'All' : stop === '0' ? 'Direct' : '1 Stop'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Sorter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-dark-400">Sort By</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-white border border-dark-700 rounded-xl px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-accent-400"
              >
                <option value="score">AI Value Score (High)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="duration_asc">Duration (Shortest)</option>
                <option value="rating_desc">Rating (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Destination Intel sidebar card */}
          {searchData.destination && (
            <div className="bg-white border border-dark-700 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-dark-100">Destination Intel</h3>
              
              <div className="flex items-center justify-between border-b border-dark-600 pb-3">
                <div>
                  <h4 className="text-base font-black text-dark-100">{searchData.destination.city}</h4>
                  <p className="text-[10px] text-dark-400">Best season: {searchData.destination.bestSeason}</p>
                </div>
                <div className="flex items-center gap-1.5 text-accent-400">
                  <Sun className="h-6 w-6" />
                  <span className="text-lg font-black text-dark-100">{searchData.destination.weather.temp}°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${getSafetyColor(searchData.destination.safetyScore)}`}>
                  <span className="text-[9px] text-dark-400 uppercase">Safety Score</span>
                  <span className="text-sm font-black text-dark-100">{searchData.destination.safetyScore}/10</span>
                </div>
                <div className="p-2.5 rounded-xl border border-dark-700 bg-dark-950 flex flex-col justify-between">
                  <span className="text-[9px] text-dark-400 uppercase">Crowds</span>
                  <span className="text-sm font-black text-dark-100">{searchData.destination.crowdLevel}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-dark-400">Top Attractions:</span>
                <ul className="text-xs space-y-1 text-dark-300">
                  {searchData.destination.places.map((place, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="inline-block h-1 w-1 rounded-full bg-accent-400"></span>
                      <span>{place}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Price Forecast Graph */}
          {priceTrend && (
            <div className="bg-white border border-dark-700 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-600 pb-4 mb-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-dark-950 border border-dark-700 flex items-center justify-center text-dark-400">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dark-100">7-Day Flight Price Trend Forecast</h3>
                    <p className="text-xs text-dark-400">ML models trained on historical route schedules</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    priceTrend.recommendation === 'Buy Now' 
                      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                      : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                  }`}>
                    AI Suggestion: {priceTrend.recommendation} ({priceTrend.confidence}% confidence)
                  </div>
                </div>
              </div>

              <div className="text-xs text-dark-300 flex items-center gap-1.5 mb-4 bg-dark-950 p-3 rounded-xl border border-dark-700">
                <Info className="h-4 w-4 text-dark-400 flex-shrink-0" />
                <span>{priceTrend.explanation}</span>
              </div>

              {/* Chart container */}
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.06)" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={10} />
                    <YAxis stroke="#6B7280" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="Price" 
                      stroke="#00A86B" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#ffffff', stroke: '#00A86B', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sub-navigation categories (All, Flights, Hotels, Trains) */}
          <div className="flex border-b border-dark-700 gap-2">
            {[
              { id: 'all', name: 'All Services' },
              { id: 'flights', name: 'Flights' },
              { id: 'hotels', name: 'Hotels' },
              { id: 'trains', name: 'Trains' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  activeSubTab === tab.id
                    ? 'border-accent-400 text-accent-400'
                    : 'border-transparent text-dark-300 hover:text-dark-100'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Feed Content */}
          <div className="space-y-4">
            {/* 1. FLIGHTS FEED */}
            {(activeSubTab === 'all' || activeSubTab === 'flights') && (
              <div className="space-y-3">
                {activeSubTab !== 'all' && <h3 className="text-sm font-bold uppercase tracking-wider text-dark-300">Flights ({getFilteredFlights().length})</h3>}
                {getFilteredFlights().length === 0 ? (
                  <p className="text-xs text-dark-400 italic">No flights matching filters</p>
                ) : (
                  getFilteredFlights().map(flight => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      onCompare={onCompare}
                      isCompared={isItemCompared(flight)}
                    />
                  ))
                )}
              </div>
            )}

            {/* 2. HOTELS FEED */}
            {(activeSubTab === 'all' || activeSubTab === 'hotels') && (
              <div className="space-y-3 pt-4">
                {activeSubTab !== 'all' && <h3 className="text-sm font-bold uppercase tracking-wider text-dark-300">Hotels ({getFilteredHotels().length})</h3>}
                {getFilteredHotels().length === 0 ? (
                  <p className="text-xs text-dark-400 italic">No hotels matching filters</p>
                ) : (
                  getFilteredHotels().map(hotel => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      onCompare={onCompare}
                      isCompared={isItemCompared(hotel)}
                    />
                  ))
                )}
              </div>
            )}

            {/* 3. TRAINS FEED */}
            {(activeSubTab === 'all' || activeSubTab === 'trains') && (
              <div className="space-y-3 pt-4">
                {activeSubTab !== 'all' && <h3 className="text-sm font-bold uppercase tracking-wider text-dark-300">Trains ({getFilteredTrains().length})</h3>}
                {getFilteredTrains().length === 0 ? (
                  <p className="text-xs text-dark-400 italic">No trains matching filters</p>
                ) : (
                  getFilteredTrains().map(train => (
                    <TrainCard
                      key={train.id}
                      train={train}
                      onCompare={onCompare}
                      isCompared={isItemCompared(train)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
