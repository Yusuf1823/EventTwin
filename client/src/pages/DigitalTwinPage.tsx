import React, { useState } from 'react';
import {
  Layers,
  Building,
  Hotel,
  Navigation,
  Car,
  Bus,
  Users,
  Activity,
  CheckSquare,
  Square,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { RealMumbaiMap } from '../components/RealMumbaiMap';
import { REAL_MUMBAI_LOCATIONS, LocationItem } from '../data/mumbaiLocations';

export const DigitalTwinPage: React.FC = () => {
  const [layers, setLayers] = useState({
    venues: true,
    hotels: true,
    transit: true,
    parking: true,
    shuttles: true
  });

  const [activeTab, setActiveTab] = useState<'map' | 'hotels' | 'transit' | 'parking' | 'venues'>('map');
  const [locations, setLocations] = useState<LocationItem[]>(REAL_MUMBAI_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(REAL_MUMBAI_LOCATIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'CURRENT' | 'PREDICTED'>('CURRENT');
  const [predictions, setPredictions] = useState<Record<string, any> | null>(null);
  const [predictionsSource, setPredictionsSource] = useState<string>('fallback-simulation');

  React.useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/digital-twin');
        if (res.ok) {
          const data = await res.json();
          if (data.locations && data.locations.length > 0) {
            setLocations(data.locations);
            setSelectedLocation((prev) => {
              if (!prev) return data.locations[0];
              return data.locations.find((l: LocationItem) => l.id === prev.id) || data.locations[0];
            });
          }
        }
      } catch (err) {
        console.warn('Digital twin API fetch fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/predictions');
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.resources || null);
          setPredictionsSource(data.source || 'fallback-simulation');
        }
      } catch (err) {
        console.warn('Digital twin predictions fetch fallback:', err);
      }
    };

    fetchLocations();
    fetchPredictions();
  }, []);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Digital Twin</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            A live geospatial model of the Mumbai mega-event ecosystem centered on Jio World Convention Centre.
          </p>
        </div>

        {/* View Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Current vs Predicted (+30m) Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs shrink-0">
            <button
              onClick={() => setViewMode('CURRENT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'CURRENT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setViewMode('PREDICTED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'PREDICTED'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Predicted (+30m risk)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-200 font-mono uppercase">
                {predictionsSource === 'ml' ? 'ML' : 'SIM'}
              </span>
            </button>
          </div>

          {/* View Switcher (Scrollable on small devices) */}
          <div className="flex items-center overflow-x-auto max-w-full bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs whitespace-nowrap gap-1">
            {[
              { id: 'map', label: 'Ecosystem Real Map' },
              { id: 'venues', label: 'JWCC Venue' },
              { id: 'hotels', label: `Real Hotels (${locations.filter(l => l.category === 'Hotel').length})` },
              { id: 'transit', label: 'Transit Network' },
              { id: 'parking', label: 'Parking Facilities' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Layer Control Card (Col 3) */}
          <div className="lg:col-span-3 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Map Layer Filters</h2>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { key: 'venues', label: 'Venues (JWCC)', icon: Building, color: 'text-purple-400', count: 1 },
                { key: 'hotels', label: 'Real Hotels', icon: Hotel, color: 'text-amber-400', count: 6 },
                { key: 'transit', label: 'Metro & Railway', icon: Navigation, color: 'text-cyan-400', count: 4 },
                { key: 'parking', label: 'Parking Facilities', icon: Car, color: 'text-emerald-400', count: 3 },
                { key: 'shuttles', label: 'Shuttle Corridors', icon: Bus, color: 'text-blue-400', count: 1 }
              ].map((item) => {
                const Icon = item.icon;
                const isChecked = layers[item.key as keyof typeof layers];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleLayer(item.key as keyof typeof layers)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition text-left ${
                      isChecked
                        ? 'bg-slate-900 border-indigo-500/40 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isChecked ? item.color : 'text-slate-600'}`} />
                      <div>
                        <span className="font-semibold block">{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.count} locations</span>
                      </div>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed mt-2">
              <strong className="text-emerald-400">Map Integrity:</strong> Markers render on actual OpenStreetMap vector tiles using real Mumbai coordinates.
            </div>
          </div>

          {/* Real Map View (Col 9) */}
          <div className="lg:col-span-9 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Geographic Digital Twin Canvas
              </span>
              <span className="font-mono text-cyan-300 text-[11px]">
                Showing {locations.length} real locations
              </span>
            </div>

            {viewMode === 'PREDICTED' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span><strong>Predicted Mode (+30m Risk):</strong> Facility markers reflect forecasted load and risk bands for 30 minutes ahead.</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
                  Source: {predictionsSource === 'ml' ? 'ML Model' : 'Simulation Extrapolation'}
                </span>
              </div>
            )}

            <div className="w-full h-[380px] sm:h-[460px] lg:h-[540px]">
              <RealMumbaiMap
                locations={locations}
                selectedLocation={selectedLocation}
                onSelectLocation={(loc) => setSelectedLocation(loc)}
                activeLayers={layers}
                viewMode={viewMode}
                predictions={predictions}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW: REAL HOTELS (PHASE 3) */}
      {activeTab === 'hotels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.filter((l) => l.category === 'Hotel').map((hotel) => (
            <div
              key={hotel.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white">{hotel.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      hotel.simulated.status === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {hotel.simulated.loadPct}% Occupied
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 mb-3">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Real Hotel Record
                  </div>
                  <div><strong>Address:</strong> {hotel.real.address}</div>
                  <div><strong>Capacity:</strong> {hotel.real.publishedCapacity}</div>
                  <div className="text-slate-500 text-[10px]">Source: {hotel.real.source}</div>
                </div>

                <div className="text-xs text-slate-300">
                  Simulated Guests: <strong>{hotel.simulated.currentVisitors} / {hotel.simulated.capacity}</strong>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-xs text-slate-300 leading-relaxed italic">
                "{hotel.simulated.aiNote}"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW: REAL TRANSIT (PHASE 7) */}
      {activeTab === 'transit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.filter((l) => l.category === 'Transit').map((stn) => (
            <div
              key={stn.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <h3 className="text-base font-bold text-white">{stn.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                      stn.simulated.status === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : stn.simulated.status === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {stn.simulated.status} ({stn.simulated.loadPct}%)
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 mb-3">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Mumbai Transit Station
                  </div>
                  <div><strong>Address:</strong> {stn.real.address}</div>
                  <div><strong>Network Spec:</strong> {stn.real.publishedCapacity}</div>
                  <div><strong>Throughput Capacity:</strong> {stn.simulated.capacity.toLocaleString()} passengers/hour</div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-xs text-slate-200">
                <strong>AI Transit Suggestion:</strong> {stn.simulated.aiNote}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW: PARKING (PHASE 9) */}
      {activeTab === 'parking' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.filter((l) => l.category === 'Parking').map((prk) => (
            <div
              key={prk.id}
              className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                prk.real.verified ? 'border-indigo-500/40' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white text-sm">{prk.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      prk.simulated.status === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300'
                        : prk.simulated.status === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {prk.simulated.loadPct}% Full
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 mb-3">
                  <div
                    className={`font-bold text-[11px] ${
                      prk.real.verified ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  >
                    {prk.real.verified ? '✓ REAL PARKING FACILITY' : '⚠ SIMULATED EVENT PARKING ZONE'}
                  </div>
                  <div><strong>Location:</strong> {prk.real.address}</div>
                  <div><strong>Published Spec:</strong> {prk.real.publishedCapacity}</div>
                  <div>Simulated Cars: <strong>{prk.simulated.currentVisitors.toLocaleString()} / {prk.simulated.capacity.toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {prk.simulated.aiNote}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW: VENUES (PHASE 2) */}
      {activeTab === 'venues' && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-purple-950/10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                Primary Event Venue • Bandra Kurla Complex
              </span>
              <h2 className="text-xl font-black text-white mt-1">Jio World Convention Centre (JWCC)</h2>
            </div>
            <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/40">
              HIGH PRESSURE (84%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Official Real Mumbai Venue Data
              </div>
              <div><strong>Official Address:</strong> Jio World Centre, G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400098, India</div>
              <div><strong>Geographic Position:</strong> 19.0638° N, 72.8682° E (Verified mapping source)</div>
              <div><strong>Published Facilities:</strong> World-class convention halls, multi-level exhibition pavilions, and on-premises basement parking for up to 5,000 cars.</div>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="text-cyan-400 font-bold">Simulated Operational Telemetry</div>
              <div>Current Attendees in Precinct: <strong>42,000 visitors</strong></div>
              <div>Capacity Utilization: <strong>84%</strong> (Predicted 118% in 45 mins)</div>
              <div>Turnstile Entry Rate: <strong>1,400 visitors/minute</strong></div>
              <div className="text-rose-400 font-semibold">Overload ETA: 45 minutes without intervention</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
