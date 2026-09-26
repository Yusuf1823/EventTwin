/**
 * EVENTTWIN PREDICTION SERVICE
 * Central predictive inference service supporting multi-horizon forecasts (15m, 30m, 45m).
 * 
 * ARCHITECTURE:
 * 1. Primary Path (ML Model): Uses trained brain.js neural network (mlModel.js)
 *    for zone-demand forecasting. Trained on 20K synthetic samples from simulationEngine.
 * 2. Fallback Path (Deterministic Simulation): If the ML model is unavailable or throws,
 *    gracefully falls back to fallbackForecast.js (Phase 1 causal simulation engine extrapolation).
 * 3. Truthful Transparency: Always marks the exact source ("ml" | "fallback-simulation")
 *    so the UI never misrepresents simulation as ML or vice versa.
 */

import { generateFallbackForecast } from './fallbackForecast.js';
import { loadTrainedModel, isModelAvailable, runInference } from './mlModel.js';

/**
 * Model Loader
 * Attempts to load trained brain.js neural network weights from disk.
 * Called once at server startup.
 */
export async function loadModel() {
  if (!isModelAvailable()) {
    throw new Error("Model not available: No trained model weights found. Run: node server/prediction/trainModel.js");
  }
  const loaded = await loadTrainedModel();
  if (!loaded) {
    throw new Error("Model not available: Failed to load trained model weights from disk.");
  }
  console.log('[PredictionService] ✅ ML model loaded successfully — predictions will use source: "ml"');
  return true;
}

/**
 * Model Inference
 * Runs the trained brain.js neural network against current state & scenario parameters.
 * 
 * @param {Object} state - Current canonical event state
 * @param {Object} scenarioParams - Active scenario shock & disruption inputs
 * @param {number[]} horizonsMinutes - Prediction horizons in minutes
 * @returns {Promise<Object>} ML-generated forecast object keyed by `${horizon}min`
 */
export async function predictWithModel(state, scenarioParams = {}, horizonsMinutes = [15, 30, 45]) {
  if (!isModelAvailable()) {
    throw new Error("Model not available: No trained model found.");
  }
  return await runInference(state, scenarioParams, horizonsMinutes);
}

/**
 * Predict future event and infrastructure states across horizons
 * 
 * @param {Object} state - Current canonical event state
 * @param {Object} scenarioParams - Scenario parameters (growth, rain, disruptions, delays)
 * @param {number[]} horizonsMinutes - List of horizon minutes, default [15, 30, 45]
 * @returns {Promise<{ [horizonKey: string]: Object, source: "ml" | "fallback-simulation" }>}
 */
export async function predictFuture(state, scenarioParams = {}, horizonsMinutes = [15, 30, 45]) {
  // 1. Attempt primary ML model inference
  try {
    const mlResults = await predictWithModel(state, scenarioParams, horizonsMinutes);
    return {
      ...mlResults,
      source: "ml"
    };
  } catch (err) {
    // 2. Seamlessly fall back to deterministic simulation forecast
    // Log fallback note for operational transparency without halting execution
    console.info(`[PredictionService] ML inference unavailable (${err.message}). Engaging deterministic simulation fallback.`);

    const fallbackResults = generateFallbackForecast(state, scenarioParams, horizonsMinutes);
    return {
      ...fallbackResults,
      source: "fallback-simulation"
    };
  }
}
