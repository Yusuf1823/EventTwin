import React, { useState } from 'react';
import {
  Layers,
  Building,
  Hotel,
  Navigation,
  Car,
  Bus,
  CheckSquare,
  Square,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { RealMumbaiMap } from '../components/RealMumbaiMap';
import { WeatherHUD } from '../components/WeatherHUD';
import { REAL_MUMBAI_LOCATIONS, LocationItem } from '../data/mumbaiLocations';
import { GlassCard } from '../ui/GlassCard';
import { PageHeader } from '../ui/PageHeader';
import { SectionHeader } from '../ui/SectionHeader';
import { SegmentedControl } from '../ui/SegmentedControl';
import { FacilityCard } from '../ui/FacilityCard';
import { RiskBadge } from '../ui/RiskBadge';
import { LoadBar } from '../ui/LoadBar';
import { AnimatedStat } from '../ui/AnimatedStat';
import { cn } from '../ui/cn';

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
            const merged = data.locations.map((loc: any) => {
              const fallback = REAL_MUMBAI_LOCATIONS.find(r => r.id === loc.id) || REAL_MUMBAI_LOCATIONS[0];
              return {
                ...fallback,
                ...loc,
                real: { ...fallback.real, ...(loc.real || {}) },
                simulated: {
                  ...fallback.simulated,
                  ...(loc.simulated || {})
                }
              };
            });
            setLocations(merged);
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
    <div className="flex flex-col gap-6 page-enter">
      <PageHeader
        title="Digital Twin"
        accent={
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider">Geospatial Model · JWCC BKC</span>
          </div>
        }
        subtitle="Live geospatial model of the Mumbai mega-event ecosystem centered on Jio World Convention Centre."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              options={[
                { id: 'CURRENT', label: 'Current' },
                {
                  id: 'PREDICTED',
                  label: (
                    <span className="flex items-center gap-1.5">
                      Predicted (+30m)
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-200 font-mono">
                        {predictionsSource === 'ml' ? 'ML' : 'SIM'}
                      </span>
                    </span>
                  )
                }
              ]}
            />
            <SegmentedControl
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { id: 'map', label: 'Ecosystem map' },
                { id: 'venues', label: 'JWCC venue' },
                { id: 'hotels', label: `Hotels (${locations.filter((l) => l.category === 'Hotel').length})` },
                { id: 'transit', label: 'Transit' },
                { id: 'parking', label: 'Parking' }
              ]}
            />
          </div>
        }
      />

      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <GlassCard className="lg:col-span-3 flex flex-col gap-4" variant="elevated">
            <SectionHeader
              title="Map Layers"
              subtitle="Toggle visible data overlays"
              color="cyan"
              className="border-b border-white/8 pb-3"
            />
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
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition text-left',
                      isChecked
                        ? 'bg-cyan-500/8 border-cyan-500/30 text-slate-200'
                        : 'bg-slate-950/40 border-white/8 text-slate-500'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isChecked ? item.color : 'text-slate-600'}`} />
                      <div>
                        <span className="font-semibold block">{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.count} locations</span>
                      </div>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-emerald-400">Map integrity:</strong> Markers render on actual tiles using real Mumbai coordinates.
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-9 flex flex-col gap-3" padded={false}>
            <div className="flex items-center justify-between px-5 pt-5">
              <SectionHeader title="Geographic Canvas" subtitle={`${locations.length} verified real Mumbai locations`} color="violet" />
              <span className="font-mono text-cyan-300 text-[11px] shrink-0">
                {isLoading ? 'Syncing…' : 'Live'}
              </span>
            </div>
            {viewMode === 'PREDICTED' && (
              <div className="mx-5 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    <strong>Predicted mode (+30m):</strong> Markers use forecasted load and risk bands.
                  </span>
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
                  Source: {predictionsSource === 'ml' ? 'ML Model' : 'Simulation Extrapolation'}
                </span>
              </div>
            )}

            <div className="w-full h-[380px] sm:h-[460px] lg:h-[540px] relative">
              <WeatherHUD />
              <RealMumbaiMap
                locations={locations}
                selectedLocation={selectedLocation}
                onSelectLocation={(loc) => setSelectedLocation(loc)}
                activeLayers={layers}
                viewMode={viewMode}
                predictions={predictions}
              />
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'hotels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.filter((l) => l.category === 'Hotel').map((hotel) => (
            <FacilityCard key={hotel.id} location={hotel} />
          ))}
        </div>
      )}

      {activeTab === 'transit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.filter((l) => l.category === 'Transit').map((stn) => (
            <FacilityCard
              key={stn.id}
              location={stn}
              extra={
                <div className="text-[11px] text-slate-400">
                  Throughput: <strong className="text-white">{stn.simulated.capacity.toLocaleString()}</strong> pax/hour
                </div>
              }
            />
          ))}
        </div>
      )}

      {activeTab === 'parking' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.filter((l) => l.category === 'Parking').map((prk) => (
            <FacilityCard
              key={prk.id}
              location={prk}
              extra={
                <div
                  className={`text-[10px] font-mono font-bold uppercase ${
                    prk.real.verified ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  {prk.real.verified ? 'Real parking facility' : 'Simulated event parking zone'}
                </div>
              }
            />
          ))}
        </div>
      )}

      {activeTab === 'venues' && (
        <GlassCard className="border-violet-500/30 bg-violet-950/10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div>
              <span className="text-[10px] font-mono text-violet-300 font-bold uppercase tracking-wider">
                Primary event venue · Bandra Kurla Complex
              </span>
              <h2 className="font-display text-xl font-extrabold text-white mt-1">
                Jio World Convention Centre (JWCC)
              </h2>
            </div>
            <RiskBadge risk="HIGH">HIGH PRESSURE 84%</RiskBadge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs text-slate-300 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <CheckCircle2 className="w-4 h-4" /> Official real venue data
              </div>
              <div>
                <strong>Address:</strong> Jio World Centre, G Block, Bandra Kurla Complex, Bandra East, Mumbai,
                Maharashtra 400098, India
              </div>
              <div>
                <strong>Position:</strong> 19.0638° N, 72.8682° E
              </div>
              <div>
                <strong>Facilities:</strong> Convention halls, exhibition pavilions, basement parking up to 5,000 cars.
              </div>
            </div>
            <div className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20 text-xs text-slate-300 space-y-3">
              <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">Simulated telemetry</div>
              <div className="flex items-end justify-between">
                <span>Attendees in precinct</span>
                <strong className="text-white text-sm">42,000</strong>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Capacity utilization</span>
                  <AnimatedStat value={84} suffix="%" className="text-white font-bold" />
                </div>
                <LoadBar pct={84} />
              </div>
              <div>
                Turnstile entry: <strong>1,400 visitors/minute</strong>
              </div>
              <div className="text-rose-400 font-semibold">Overload ETA: 45 minutes without intervention</div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
