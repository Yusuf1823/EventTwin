/**
 * EVENTTWIN DETERMINISTIC FALLBACK FORECAST
 * Physics-based causal extrapolation derived from Phase 1 simulationEngine.js.
 * 
 * IMPORTANT DATA-HONESTY RULE:
 * This is a deterministic simulation extrapolation modeling ripple-effect chains
 * over time horizons (15m, 30m, 45m). It is NOT machine learning and must never
 * be labeled as such.
 */

import {
  getCanonicalBaselineState,
  calculateEventTwinStressIndex,
  simulateScenario,
  BASE_ZONE_DISTRIBUTION,
  BASELINE_TOTAL_VISITORS
} from '../simulationEngine.js';

/**
 * Generates deterministic simulation forecast for given horizons
 * @param {Object} state - Current canonical event state (or null for baseline)
 * @param {Object} scenarioParams - Active scenario disruption & shock parameters
 * @param {number[]} horizonsMinutes - Forecast horizons in minutes (default [15, 30, 45])
 * @returns {Object} Forecast map keyed by `${horizon}min`
 */
export function generateFallbackForecast(state, scenarioParams = {}, horizonsMinutes = [15, 30, 45]) {
  // 1. Resolve base canonical state
  const baseCanonical = getCanonicalBaselineState();
  const currentState = state?.loads ? state : baseCanonical.state;

  const currentTotalVisitors = currentState.totalVisitors || BASELINE_TOTAL_VISITORS;
  const currentZoneBreakdown = currentState.zoneBreakdown || {
    zoneA: BASE_ZONE_DISTRIBUTION.zoneA.baseVisitors,
    zoneB: BASE_ZONE_DISTRIBUTION.zoneB.baseVisitors,
    zoneC: BASE_ZONE_DISTRIBUTION.zoneC.baseVisitors
  };
  const currentLoads = currentState.loads || {
    venueLoad: 84,
    transitLoad: 91,
    parkingLoad: 78,
    hotelOccupancy: 81,
    mobilityLoad: 85,
    demandImbalance: 35
  };

  // 2. Extract scenario parameters
  const visitorGrowthPct = scenarioParams.visitorGrowthPct ?? scenarioParams.visitorGrowth ?? scenarioParams.visitorIncreasePct ?? 5;
  const rainImpactPct = scenarioParams.rainImpactPct ?? scenarioParams.rain_factor ?? 0;
  const transitReductionPct = scenarioParams.transitReductionPct ?? scenarioParams.transit_disruption ?? 0;
  const parkingReductionPct = scenarioParams.parkingReductionPct ?? scenarioParams.parking_reduction ?? 0;
  const venueDelayMinutes = scenarioParams.venueDelayMinutes ?? scenarioParams.venue_delay ?? 0;

  // 3. Drive Phase 1 simulationEngine to obtain the unmitigated ripple-effects baseline
  const effectiveSimIncreasePct = Math.max(0, Math.round(((currentTotalVisitors - BASELINE_TOTAL_VISITORS) / BASELINE_TOTAL_VISITORS) * 100));
  const simResult = simulateScenario(null, {
    visitorIncreasePct: effectiveSimIncreasePct,
    rainImpactPct,
    transitReductionPct,
    parkingReductionPct,
    venueDelayMinutes
  });

  const forecast = {};

  // 4. Project forward across each horizon
  for (const horizon of horizonsMinutes) {
    const horizonHours = horizon / 60.0;

    // Projected visitor growth over this horizon
    const horizonGrowthFactor = 1.0 + (visitorGrowthPct / 100.0) * horizonHours;
    const projectedTotalVisitors = Math.round(currentTotalVisitors * horizonGrowthFactor);

    // Spatial demand distribution with strict physical conservation
    const additionalVisitors = projectedTotalVisitors - currentTotalVisitors;
    // Zone A core arena receives majority of incremental influx during event flow
    const deltaA = Math.round(additionalVisitors * 0.55);
    const deltaB = Math.round(additionalVisitors * 0.27);
    const deltaC = additionalVisitors - deltaA - deltaB;

    const projectedZoneA = currentZoneBreakdown.zoneA + deltaA;
    const projectedZoneB = currentZoneBreakdown.zoneB + deltaB;
    const projectedZoneC = currentZoneBreakdown.zoneC + deltaC;

    // Time-accumulated ripple multipliers over the horizon
    // Gate backlog compounds if turnstile delay exists
    const venueQueueCompound = 1.0 + (venueDelayMinutes / 60.0) * horizonHours * 0.35 + (rainImpactPct / 100.0) * horizonHours * 0.20;
    const projectedVenueLoad = Math.max(0, Math.round(simResult.before.venueLoad * horizonGrowthFactor * venueQueueCompound));

    // Transit platform crowding accumulates over time under reduction
    const transitBacklogCompound = 1.0 + (transitReductionPct / 100.0) * horizonHours * 0.30;
    const projectedTransitLoad = Math.max(0, Math.round(simResult.before.transitLoad * horizonGrowthFactor * transitBacklogCompound));

    // Parking dwell time compounds with rain and transit spillover
    const parkingSpilloverFactor = 1.0 + (transitReductionPct / 100.0) * 0.35 * horizonHours;
    const parkingRainFactor = 1.0 + (rainImpactPct / 100.0) * 0.20 * horizonHours;
    const projectedParkingLoad = Math.max(0, Math.round(simResult.before.parkingLoad * horizonGrowthFactor * parkingSpilloverFactor * parkingRainFactor));

    // Hotel occupancy scales sublinearly
    const projectedHotelLoad = Math.min(100, Math.max(0, Math.round(simResult.before.hotelOccupancy * (horizonGrowthFactor ** 0.5))));

    // Mobility composite
    const projectedMobilityLoad = Math.round(projectedTransitLoad * 0.8 + (simResult.before.loads?.shuttleLoad ?? 55) * 0.2);

    // Zone loads
    const zoneALoad = projectedVenueLoad;
    const zoneBLoad = Math.round(projectedTransitLoad * 0.9);
    // Zone C serves as the absorbing buffer (consistently lower pressure)
    const zoneCLoad = Math.min(85, Math.round(45 * horizonGrowthFactor + (rainImpactPct / 100.0) * 10));

    const maxZoneLoad = Math.max(zoneALoad, zoneBLoad, zoneCLoad);
    const minZoneLoad = Math.min(zoneALoad, zoneBLoad, zoneCLoad);
    const demandImbalance = Math.max(0, maxZoneLoad - minZoneLoad);

    // Calculate EventTwin Stress Index
    const stress = calculateEventTwinStressIndex({
      mobilityLoad: projectedMobilityLoad,
      venueLoad: projectedVenueLoad,
      parkingLoad: projectedParkingLoad,
      hotelOccupancy: projectedHotelLoad,
      demandImbalance
    });

    // Time to critical overload estimation
    const overloadMinutesRemaining = projectedVenueLoad >= 90
      ? Math.max(10, Math.round(60 - (projectedVenueLoad - 90) * 1.5 - horizon))
      : null;

    // Structured Zone Predictions adhering to EventTwin frontend interface
    const predictions = [
      {
        id: `pred_zone_a_${horizon}m`,
        zone: "Zone A (Core Arena - JWCC BKC)",
        current: currentLoads.venueLoad || 84,
        predicted: zoneALoad,
        expectedMinutes: overloadMinutesRemaining,
        status: zoneALoad >= 100 ? "CRITICAL" : zoneALoad >= 85 ? "HIGH" : "NORMAL",
        explanation: `At +${horizon}m, visitor demand (${zoneALoad}% load) ${zoneALoad >= 100 ? 'will overwhelm turnstile gates and Avenue 3 corridors.' : 'remains elevated within operable thresholds.'}`,
        suggestedAction: zoneALoad >= 85 ? "Divert 15% inbound traffic to Zone C Kalina concourses and activate staggered entry." : "Maintain standard ingress flow."
      },
      {
        id: `pred_zone_b_${horizon}m`,
        zone: "Zone B (Bandra/Santacruz Artery)",
        current: currentLoads.transitLoad || 83,
        predicted: zoneBLoad,
        expectedMinutes: zoneBLoad >= 90 ? Math.max(20, 60 - horizon) : null,
        status: zoneBLoad >= 90 ? "HIGH" : "NORMAL",
        explanation: `Feeder transit along Western Express Highway operating at ${zoneBLoad}% flow rate at +${horizon}m.`,
        suggestedAction: zoneBLoad >= 90 ? "Reroute selected express shuttles via Kalina-Kurla bypass." : "Monitor suburban line headway."
      },
      {
        id: `pred_zone_c_${horizon}m`,
        zone: "Zone C (Kalina Spillover Hub)",
        current: 48,
        predicted: zoneCLoad,
        expectedMinutes: null,
        status: "AVAILABLE CAPACITY",
        freeParkingBays: Math.max(5000, Math.round(8250 - (zoneCLoad - 45) * 60)),
        explanation: `Surplus capacity buffer available (${zoneCLoad}% load) with thousands of free parking bays and open transit bandwidth at +${horizon}m.`,
        suggestedAction: "Ready to absorb diverted visitors and overflow vehicles."
      }
    ];

    forecast[`${horizon}min`] = {
      horizonMinutes: horizon,
      projectedTime: new Date(Date.now() + horizon * 60000).toISOString(),
      method: "DETERMINISTIC_SIMULATION_EXTRAPOLATION",
      isML: false,
      disclaimer: "Deterministic extrapolation calculated from Phase 1 simulation ripple-effect formulas. NOT an ML prediction.",
      totalVisitors: projectedTotalVisitors,
      zoneBreakdown: {
        zoneA: projectedZoneA,
        zoneB: projectedZoneB,
        zoneC: projectedZoneC
      },
      loads: {
        venueLoad: projectedVenueLoad,
        transitLoad: projectedTransitLoad,
        parkingLoad: projectedParkingLoad,
        hotelOccupancy: projectedHotelLoad,
        mobilityLoad: projectedMobilityLoad,
        demandImbalance
      },
      stressIndex: stress.compositeStress,
      stressBreakdown: stress.breakdown,
      criticalAreasCount: (projectedVenueLoad >= 90 ? 1 : 0) + (projectedTransitLoad >= 90 ? 1 : 0) + (projectedParkingLoad >= 90 ? 1 : 0),
      predictions
    };
  }

  return forecast;
}
