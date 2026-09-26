/**
 * EVENT CONFIG & CANONICAL STATE INITIALIZER MODULE
 * Manages event-specific configurations, Firebase RTDB persistence (eventConfig/{eventId}),
 * and canonical state initialization from user onboarding parameters.
 */

import { db, isFirebaseAvailable } from './firebase.js';
import { BASE_LOCATIONS, buildStateFromLocations } from './simulationEngine.js';

let memoryEventConfig = {
  eventId: 'evt_baseline_jwcc',
  eventName: 'Mumbai Global Mega-Concert & Expo 2026',
  eventDate: '2026-10-15',
  startTime: '10:00',
  endTime: '22:00',
  visitorInputMode: 'exact',
  totalVisitors: 500000,
  visitorRange: null,
  venue: {
    isCustom: false,
    id: 'jwcc_bkc',
    name: 'Jio World Convention Centre (JWCC)',
    address: 'Jio World Centre, G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400098',
    capacity: 50000
  },
  eventType: 'Mega Event',
  eventTypePreset: {
    id: 'Mega Event',
    shape: 'point-based',
    weights: {
      mobilityWeight: 0.30,
      venueWeight: 0.25,
      parkingWeight: 0.20,
      hotelWeight: 0.15,
      demandImbalanceWeight: 0.10
    }
  },
  facilityIds: [
    'hotel_trident_bkc',
    'hotel_sofitel_bkc',
    'hotel_grand_hyatt',
    'hotel_taj_santacruz',
    'hotel_itc_maratha',
    'hotel_jw_marriott_sahar',
    'transit_metro_line_3_bkc',
    'transit_bandra_station',
    'transit_kurla_station',
    'transit_csmia_airport',
    'parking_jwcc_onpremise',
    'parking_kalina_spillover',
    'parking_bandra_reclamation',
    'shuttle_kalina_jwcc'
  ],
  customFacilities: [],
  ticketingStatus: 'ticketed'
};

/**
 * Save event config to Firebase RTDB and in-memory store
 */
export async function saveEventConfig(payload) {
  const eventId = payload.eventId || `evt_${Date.now()}`;
  const config = { ...payload, eventId, updatedAt: new Date().toISOString() };
  memoryEventConfig = config;

  if (isFirebaseAvailable && db) {
    try {
      await db.ref(`eventConfig/${eventId}`).set(config);
      await db.ref(`eventConfig/current`).set(config);
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to save eventConfig/:', err.message);
    }
  }
  return config;
}

/**
 * Get active event config from Firebase RTDB or in-memory store
 */
export async function getEventConfig(eventId = 'current') {
  if (isFirebaseAvailable && db) {
    try {
      const snap = await db.ref(`eventConfig/${eventId}`).once('value');
      const val = snap.val();
      if (val) return val;
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to read eventConfig/, using in-memory fallback:', err.message);
    }
  }
  return memoryEventConfig;
}

/**
 * Build canonical locations & state from event config
 */
export function initializeStateFromConfig(config) {
  const totalVisitors = Number(config.totalVisitors) || 500000;
  const venue = config.venue || {};

  // 1. Build Venue Location (Zone A)
  let venueLoc;
  if (venue.isCustom) {
    const customCap = Number(venue.capacity) || 50000;
    const baseDemand = Math.round(customCap * 0.84);
    venueLoc = {
      id: venue.id || 'custom_venue',
      name: venue.name || 'Custom Venue',
      category: 'Venue',
      zone: 'Zone A (Core Event Precinct)',
      real: {
        address: venue.address || 'BKC, Mumbai',
        latitude: 19.0638,
        longitude: 72.8682,
        source: 'Custom User Provided Venue',
        verified: false,
        publishedCapacity: `Custom event venue (capacity: ${customCap.toLocaleString()})`
      },
      baseCapacity: customCap,
      baseDemand,
      operationalMetricLabel: 'Simulated Venue Utilization',
      simulated: {
        currentVisitors: baseDemand,
        capacity: customCap,
        loadPct: Math.round((baseDemand / customCap) * 100),
        predictedLoadPct: Math.round((baseDemand / customCap) * 100 * 1.15),
        status: 'HIGH',
        operationalMetricLabel: 'Simulated Venue Utilization',
        aiNote: `Simulated venue load for ${venue.name}.`
      }
    };
  } else {
    const baseV = BASE_LOCATIONS.find((l) => l.id === (venue.id || 'jwcc_bkc')) || BASE_LOCATIONS[0];
    venueLoc = JSON.parse(JSON.stringify(baseV));
  }

  // 2. Build Selected Facilities
  const selectedIds = new Set(config.facilityIds || []);
  const locations = [venueLoc];

  BASE_LOCATIONS.forEach((b) => {
    if (b.category !== 'Venue' && selectedIds.has(b.id)) {
      locations.push(JSON.parse(JSON.stringify(b)));
    }
  });

  // 3. Add Custom Facilities if any
  if (Array.isArray(config.customFacilities)) {
    config.customFacilities.forEach((cf) => {
      const cap = Number(cf.capacity) || 500;
      const baseDemand = Math.round(cap * 0.75);
      const zoneName =
        cf.category === 'Hotel'
          ? 'Zone B (Bandra/Santacruz Artery)'
          : cf.category === 'Transit'
          ? 'Zone A (Core Event Precinct)'
          : 'Zone C (Airport/Spillover Hub)';

      locations.push({
        id: cf.id,
        name: cf.name,
        category: cf.category,
        zone: zoneName,
        real: {
          address: cf.address || 'Mumbai Precinct',
          latitude: 19.068,
          longitude: 72.865,
          source: 'User Provided Custom Facility',
          verified: false,
          publishedCapacity: `Custom ${cf.category} (Cap: ${cap})`
        },
        baseCapacity: cap,
        baseDemand,
        operationalMetricLabel: `Simulated ${cf.category} Load`,
        simulated: {
          currentVisitors: baseDemand,
          capacity: cap,
          loadPct: Math.round((baseDemand / cap) * 100),
          predictedLoadPct: Math.round((baseDemand / cap) * 110),
          status: 'NORMAL',
          operationalMetricLabel: `Simulated ${cf.category} Load`,
          aiNote: `Custom ${cf.category} facility active.`
        }
      });
    });
  }

  // 4. Weight profile driven by eventTypePreset
  const weightProfile = config.eventTypePreset?.weights || null;

  // 5. Build Canonical State
  const state = buildStateFromLocations(locations, totalVisitors, null, weightProfile);

  // 6. Build Event Meta Summary
  const eventMeta = {
    eventId: config.eventId,
    eventName: config.eventName,
    eventDate: config.eventDate,
    startTime: config.startTime,
    endTime: config.endTime,
    eventType: config.eventType,
    ticketingStatus: config.ticketingStatus,
    cityStressPct: state.stressIndex,
    transitLoadPct: state.loads.transitLoad,
    parkingLoadPct: state.loads.parkingLoad,
    venueLoadPct: state.loads.venueLoad,
    hotelOccupancyPct: state.loads.hotelOccupancy,
    criticalAreasCount: state.criticalAreasCount,
    currentVisitorsSimulated: totalVisitors,
    cityStressExplanation: `Calculated from ${config.eventName} event parameters & ${config.eventType} weight profile.`,
    lastUpdated: new Date().toISOString()
  };

  return {
    eventMeta,
    locations,
    state,
    config
  };
}

export default {
  saveEventConfig,
  getEventConfig,
  initializeStateFromConfig
};
