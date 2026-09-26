/**
 * EVENTTWIN PREDICTION API ROUTER
 * Handles GET /api/predictions and POST /api/predictions/scenario
 */

import express from 'express';
import { predictFuture } from './predictionService.js';
import { classifyRisk, timeToThreshold } from './riskClassifier.js';
import { simulateScenario, buildStateFromLocations } from '../simulationEngine.js';
import { generateExplanation } from './explain.js';
import { getModelMetrics } from './mlModel.js';

export const predictionRouter = express.Router();


/**
 * Helper to build resource-level forecast breakdown with risk labels and time-to-critical
 */
export function buildResourceForecasts(currentState, forecastData) {
  const horizons = [15, 30, 45];
  const horizonKeys = ['15min', '30min', '45min'];

  // Current loads
  const currentLoads = currentState?.loads || {};
  const currentZones = currentState?.zones || [];

  const getZoneCurrent = (key, fallback) => {
    const found = currentZones.find(z => z.zone.includes(key));
    return found ? found.loadPct : fallback;
  };

  const resourceDefs = [
    {
      resource: 'Zone A',
      category: 'Zone',
      currentLoad: getZoneCurrent('Zone A', currentLoads.venueLoad || 84),
      extractForecast: (data) => data.predictions?.find(p => p.zone.includes('Zone A'))?.predicted ?? data.loads.venueLoad
    },
    {
      resource: 'Zone B',
      category: 'Zone',
      currentLoad: getZoneCurrent('Zone B', 80),
      extractForecast: (data) => data.predictions?.find(p => p.zone.includes('Zone B'))?.predicted ?? Math.round(data.loads.transitLoad * 0.9)
    },
    {
      resource: 'Zone C',
      category: 'Zone',
      currentLoad: getZoneCurrent('Zone C', 48),
      extractForecast: (data) => data.predictions?.find(p => p.zone.includes('Zone C'))?.predicted ?? 45
    },
    {
      resource: 'Venue',
      category: 'Venue',
      currentLoad: currentLoads.venueLoad ?? 84,
      extractForecast: (data) => data.loads.venueLoad
    },
    {
      resource: 'Transit',
      category: 'Transit',
      currentLoad: currentLoads.transitLoad ?? 91,
      extractForecast: (data) => data.loads.transitLoad
    },
    {
      resource: 'Parking',
      category: 'Parking',
      currentLoad: currentLoads.parkingLoad ?? 78,
      extractForecast: (data) => data.loads.parkingLoad
    },
    {
      resource: 'Hotel',
      category: 'Hotel',
      currentLoad: currentLoads.hotelOccupancy ?? 81,
      extractForecast: (data) => data.loads.hotelOccupancy
    }
  ];

  const resources = resourceDefs.map(def => {
    const forecasts = {};
    const riskLabels = {};
    const futureLoadValues = [];

    horizonKeys.forEach((key, idx) => {
      const hData = forecastData[key];
      const val = hData ? def.extractForecast(hData) : def.currentLoad;
      forecasts[key] = val;
      riskLabels[key] = classifyRisk(val);
      futureLoadValues.push(val);
    });

    const minutesUntilCritical = timeToThreshold(def.currentLoad, futureLoadValues, horizons, 100);

    return {
      resource: def.resource,
      category: def.category,
      currentLoad: def.currentLoad,
      currentRisk: classifyRisk(def.currentLoad),
      forecasts,
      riskLabels,
      minutesUntilCritical
    };
  });

  // Identify next critical event (soonest non-null crossing)
  const criticalCandidates = resources
    .filter(r => r.minutesUntilCritical !== null)
    .sort((a, b) => a.minutesUntilCritical - b.minutesUntilCritical);

  const nextCriticalEvent = criticalCandidates.length > 0
    ? {
        resource: criticalCandidates[0].resource,
        minutesUntilCritical: criticalCandidates[0].minutesUntilCritical,
        currentLoad: criticalCandidates[0].currentLoad,
        projectedLoad: criticalCandidates[0].forecasts['45min'],
        riskLabel: criticalCandidates[0].riskLabels['45min']
      }
    : null;

  return { resources, nextCriticalEvent };
}

/**
 * GET /api/predictions
 * Pull current canonical state, predict future horizons, return resource breakdown & nextCriticalEvent
 */
predictionRouter.get('/', async (req, res) => {
  try {
    const canonicalState = req.app.locals.memoryCanonicalState || null;
    const forecastResult = await predictFuture(canonicalState, {}, [15, 30, 45]);
    const { resources, nextCriticalEvent } = buildResourceForecasts(canonicalState, forecastResult);

    // Generate baseline explanation
    const targetResource = nextCriticalEvent ? nextCriticalEvent.resource : (resources[0]?.resource || 'Zone A');
    const targetLoad = nextCriticalEvent ? nextCriticalEvent.projectedLoad : (resources[0]?.forecasts['45min'] || 100);
    const targetMinutes = nextCriticalEvent ? nextCriticalEvent.minutesUntilCritical : null;
    const explanationData = generateExplanation({}, targetResource, targetLoad, targetMinutes);

    // Provide legacy predictions array from 30min horizon for backward compatibility with frontend
    const legacyPredictions = forecastResult['30min']?.predictions || [];

    res.json({
      success: true,
      source: forecastResult.source,
      horizons: [15, 30, 45],
      resources,
      nextCriticalEvent,
      contributors: explanationData.contributors,
      explanation: explanationData.text,
      text: explanationData.text,
      predictions: legacyPredictions,
      modelMetrics: getModelMetrics(),
      horizonsData: {
        '15min': forecastResult['15min'],
        '30min': forecastResult['30min'],
        '45min': forecastResult['45min']
      }
    });
  } catch (err) {
    console.error('[PredictionRouter] Error in GET /api/predictions:', err);
    res.status(500).json({ error: 'Failed to generate predictions', details: err.message });
  }
});

/**
 * POST /api/predictions/scenario
 * Runs scenario through simulationEngine, then predictionService, returning resource breakdown + contributors
 */
predictionRouter.post('/scenario', async (req, res) => {
  try {
    const scenarioParams = req.body || {};
    const canonicalState = req.app.locals.memoryCanonicalState || null;

    // 1. Run simulation engine to obtain the modified scenario state
    const simResult = simulateScenario(canonicalState, scenarioParams);
    const modifiedState = buildStateFromLocations(simResult.locations, simResult.conservation.totalVisitors);

    // 2. Run prediction service on top of the modified state
    const forecastResult = await predictFuture(modifiedState, scenarioParams, [15, 30, 45]);
    const { resources, nextCriticalEvent } = buildResourceForecasts(modifiedState, forecastResult);

    // 3. Generate explanation / contributors from actual applied scenario deltas
    const targetResource = nextCriticalEvent ? nextCriticalEvent.resource : (resources[0]?.resource || 'Zone A');
    const targetLoad = nextCriticalEvent ? nextCriticalEvent.projectedLoad : (resources[0]?.forecasts['45min'] || 100);
    const targetMinutes = nextCriticalEvent ? nextCriticalEvent.minutesUntilCritical : null;

    const explanationData = generateExplanation(
      scenarioParams,
      targetResource,
      targetLoad,
      targetMinutes
    );

    res.json({
      success: true,
      source: forecastResult.source,
      horizons: [15, 30, 45],
      resources,
      nextCriticalEvent,
      contributors: explanationData.contributors,
      explanation: explanationData.text,
      text: explanationData.text,
      predictions: forecastResult['30min']?.predictions || [],
      modelMetrics: getModelMetrics(),
      horizonsData: {
        '15min': forecastResult['15min'],
        '30min': forecastResult['30min'],
        '45min': forecastResult['45min']
      },

      simulation: {
        totalVisitors: simResult.conservation.totalVisitors,
        cityStress: simResult.before.cityStress,
        loads: simResult.before
      }
    });
  } catch (err) {
    console.error('[PredictionRouter] Error in POST /api/predictions/scenario:', err);
    res.status(500).json({ error: 'Failed to generate scenario predictions', details: err.message });
  }
});
