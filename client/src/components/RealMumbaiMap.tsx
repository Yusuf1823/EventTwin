import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LocationItem } from '../data/mumbaiLocations';

interface RealMumbaiMapProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (location: LocationItem) => void;
  activeLayers?: {
    venues?: boolean;
    hotels?: boolean;
    transit?: boolean;
    parking?: boolean;
    shuttles?: boolean;
  };
  viewMode?: 'CURRENT' | 'PREDICTED';
  predictions?: any;
}

const CATEGORY_COLORS = {
  Venue: '#a855f7', // Purple
  Hotel: '#f59e0b', // Amber
  Transit: '#06b6d4', // Cyan
  Parking: '#10b981', // Emerald
  Shuttle: '#3b82f6' // Blue
};

const CATEGORY_EMOJIS = {
  Venue: '🏟',
  Hotel: '🏨',
  Transit: '🚇',
  Parking: '🅿',
  Shuttle: '🚌'
};

export const RealMumbaiMap: React.FC<RealMumbaiMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeLayers = { venues: true, hotels: true, transit: true, parking: true, shuttles: true },
  viewMode = 'CURRENT',
  predictions = null
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(() => {
        // Fallback: use CSS-based fullscreen
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().catch(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Sync state with native fullscreen changes (including ESC key)
  useEffect(() => {
    const handleChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      // Resize map to fill new container dimensions
      setTimeout(() => mapRef.current?.resize(), 100);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // ESC key fallback for CSS-only fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        setIsFullscreen(false);
        setTimeout(() => mapRef.current?.resize(), 100);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre GL map centered on Jio World Convention Centre (JWCC)
    // Longitude, Latitude: [72.8682, 19.0638]
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'dark-tiles': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 16,
            attribution: '© Esri, OpenStreetMap contributors'
          },
          'dark-labels': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 16
          }
        },
        layers: [
          {
            id: 'dark-tiles-layer',
            type: 'raster',
            source: 'dark-tiles',
            minzoom: 0,
            maxzoom: 22
          },
          {
            id: 'dark-labels-layer',
            type: 'raster',
            source: 'dark-labels',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },

      center: [72.8672, 19.0645], // Centered directly on JWCC G-Block precinct in BKC
      zoom: 14.8,
      minZoom: 12,
      maxZoom: 17.5,
      pitch: 0,
      bearing: 0
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      // Add connecting infrastructure arterial lines between JWCC, Transit, and Overflow
      map.addSource('corridors', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // BKC Metro Line 3 to JWCC
            {
              type: 'Feature',
              properties: { color: '#f43f5e', name: 'Metro Line 3 Ingress Corridor' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [72.8655, 19.0620],
                  [72.8682, 19.0638]
                ]
              }
            },
            // BKC Central Bus Station to JWCC Feeder Artery
            {
              type: 'Feature',
              properties: { color: '#f59e0b', name: 'BKC Central Avenue Feeder Artery' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [72.8630, 19.0608],
                  [72.8655, 19.0620],
                  [72.8682, 19.0638]
                ]
              }
            },
            // Kalina Overflow Staging Lot to JWCC Bypass Route
            {
              type: 'Feature',
              properties: { color: '#10b981', name: 'Kalina-BKC Bypass Mobility Corridor' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [72.8685, 19.0695],
                  [72.8690, 19.0670],
                  [72.8682, 19.0638]
                ]
              }
            },
            // Jio World Garden Concourse to JWCC
            {
              type: 'Feature',
              properties: { color: '#38bdf8', name: 'Jio World Complex Pedestrian Concourse' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [72.8665, 19.0648],
                  [72.8682, 19.0638]
                ]
              }
            }
          ]
        }
      });

      map.addLayer({
        id: 'corridor-lines',
        type: 'line',
        source: 'corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.85
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update Markers when locations or active layers change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((loc) => {
      // Filter based on active layers
      if (loc.category === 'Venue' && activeLayers.venues === false) return;
      if (loc.category === 'Hotel' && activeLayers.hotels === false) return;
      if (loc.category === 'Transit' && activeLayers.transit === false) return;
      if (loc.category === 'Parking' && activeLayers.parking === false) return;
      if (loc.category === 'Shuttle' && activeLayers.shuttles === false) return;

      const isSelected = selectedLocation?.id === loc.id;
      const isPredictedMode = viewMode === 'PREDICTED';

      let loadPct = loc.simulated.loadPct;
      let riskLabel: string = loc.simulated.status;

      if (isPredictedMode && predictions) {
        const resourceKey = loc.category === 'Shuttle' ? 'Transit' : loc.category;
        let predItem: any = null;
        if (Array.isArray(predictions)) {
          predItem = predictions.find((p: any) => p.resource === resourceKey);
        } else if (typeof predictions === 'object') {
          predItem = predictions[resourceKey];
        }

        if (predItem) {
          if (predItem.load30m !== undefined) {
            loadPct = Math.round(predItem.load30m);
            riskLabel = predItem.risk30m || riskLabel;
          } else if (predItem.forecasts?.['30min'] !== undefined) {
            loadPct = Math.round(predItem.forecasts['30min']);
            riskLabel = predItem.riskLabels?.['30min'] || riskLabel;
          } else if (predItem.horizons?.['30min'] !== undefined) {
            const h = predItem.horizons['30min'];
            loadPct = Math.round(typeof h === 'object' ? h.load : h);
            riskLabel = (typeof h === 'object' ? h.risk : predItem.riskLabels?.['30min']) || riskLabel;
          }
        }
      }

      // Status indicator color
      // In Predicted mode: LOW = green, MODERATE = yellow, HIGH = orange, CRITICAL = red
      let statusRing = '#10b981';
      if (riskLabel === 'CRITICAL') {
        statusRing = '#ef4444'; // Red
      } else if (riskLabel === 'HIGH') {
        statusRing = '#f97316'; // Orange
      } else if (riskLabel === 'MODERATE') {
        statusRing = '#eab308'; // Yellow
      } else {
        statusRing = '#10b981'; // Green (LOW / NORMAL)
      }

      // Create Custom HTML Marker DOM element
      const el = document.createElement('div');
      el.className = 'custom-map-marker';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.userSelect = 'none';

      el.innerHTML = `
        <div style="
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(71, 85, 105, 0.8);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          margin-bottom: 2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        ">
          ${loc.name.split(' ')[0]} • <span style="color: ${statusRing}">${loadPct}%</span>${isPredictedMode ? ' <span style="color:#94a3b8;font-size:8px;">(+30m)</span>' : ''}
        </div>
        <div style="
          background: #090d16;
          border: 2px solid ${statusRing};
          box-shadow: 0 0 ${isSelected ? '14px' : '8px'} ${statusRing};
          border-radius: 9999px;
          width: ${isSelected ? '34px' : '28px'};
          height: ${isSelected ? '34px' : '28px'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? '15px' : '13px'};
          transition: all 0.2s ease;
        ">
          ${CATEGORY_EMOJIS[loc.category] || '📍'}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${statusRing};
        "></div>
      `;

      el.addEventListener('click', () => {
        onSelectLocation(loc);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [loc.real.longitude, loc.real.latitude],
            zoom: 14.5,
            duration: 900
          });
        }
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([loc.real.longitude, loc.real.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

  }, [locations, selectedLocation, activeLayers, onSelectLocation, viewMode, predictions]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-full overflow-hidden border border-slate-800 ${
        isFullscreen && !document.fullscreenElement
          ? 'fixed inset-0 z-[9999] rounded-none'
          : 'rounded-2xl'
      }`}
      style={isFullscreen && !document.fullscreenElement ? { background: '#0f172a' } : {}}
    >
      <div ref={mapContainer} className="w-full h-full min-h-[480px]" />

      {/* Floating Map Legend */}
      <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs shadow-xl z-10 flex flex-col gap-2">
        <div className="font-bold text-white flex items-center justify-between gap-4">
          <span>{viewMode === 'PREDICTED' ? 'PREDICTED RISK OVERLAY' : 'REAL MUMBAI MAP (BKC)'}</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            viewMode === 'PREDICTED'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {viewMode === 'PREDICTED' ? '+30M RISK FORECAST' : 'REAL GEOGRAPHY'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Centered on: <strong className="text-purple-300">Jio World Convention Centre</strong>
        </div>
        {viewMode === 'PREDICTED' ? (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[10px]">
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL (&gt;100%)
            </span>
            <span className="flex items-center gap-1 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> HIGH (85-100%)
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> MODERATE (70-85%)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> LOW (&lt;70%)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-1 border-t border-slate-800 text-[10.5px]">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> CRITICAL (&gt;90%)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> HIGH (70-90%)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> AVAILABLE (&lt;70%)
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700 hover:border-purple-500/60 hover:bg-slate-900 text-slate-300 hover:text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/20 cursor-pointer group"
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>
    </div>
  );
};
