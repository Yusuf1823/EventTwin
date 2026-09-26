/**
 * EVENTTWIN RISK CLASSIFIER & THRESHOLD ESTIMATOR
 * Classifies infrastructure load risk bands and calculates time-to-threshold
 * via linear interpolation across forward-looking forecast horizons.
 */

/**
 * Classifies infrastructure utilization into four standardized operational risk bands
 * Thresholds:
 *   - < 70%      : LOW
 *   - 70% – 85%  : MODERATE
 *   - 85% – 100% : HIGH
 *   - > 100%     : CRITICAL
 * 
 * @param {number} loadPercent - Facility or zone load percentage
 * @returns {'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'} Risk classification band
 */
export function classifyRisk(loadPercent) {
  if (typeof loadPercent !== 'number' || isNaN(loadPercent)) {
    return 'LOW';
  }
  if (loadPercent > 100) return 'CRITICAL';
  if (loadPercent >= 85) return 'HIGH';
  if (loadPercent >= 70) return 'MODERATE';
  return 'LOW';
}

/**
 * Calculates minutes until crossing a given load threshold via linear interpolation
 * between the two nearest horizon points.
 * 
 * @param {number} currentLoad - Current load percentage at time t = 0
 * @param {number[] | Object} futureLoadsByHorizon - Future load values by horizon
 * @param {number[]} horizonsMinutes - Array of horizon minutes, e.g. [15, 30, 45]
 * @param {number} thresholdPercent - Target threshold percentage (default 100)
 * @returns {number | null} Estimated minutes until crossing threshold, or null if not crossed
 */
export function timeToThreshold(currentLoad, futureLoadsByHorizon, horizonsMinutes = [15, 30, 45], thresholdPercent = 100) {
  if (typeof currentLoad !== 'number' || isNaN(currentLoad)) return null;

  // Already at or above the threshold at t = 0
  if (currentLoad >= thresholdPercent) {
    return 0;
  }

  // Build ordered series of points starting at t = 0: [{ time: 0, load: currentLoad }, ...]
  const points = [{ time: 0, load: currentLoad }];

  horizonsMinutes.forEach((h, idx) => {
    let val;
    if (Array.isArray(futureLoadsByHorizon)) {
      val = futureLoadsByHorizon[idx];
    } else if (futureLoadsByHorizon && typeof futureLoadsByHorizon === 'object') {
      val = futureLoadsByHorizon[h] ??
            futureLoadsByHorizon[`${h}min`] ??
            futureLoadsByHorizon[h]?.load ??
            futureLoadsByHorizon[`${h}min`]?.load;
    }
    if (typeof val === 'number' && !isNaN(val)) {
      points.push({ time: Number(h), load: val });
    }
  });

  // Ensure points are sorted chronologically
  points.sort((a, b) => a.time - b.time);

  // Search for the consecutive segment crossing thresholdPercent
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    if (p1.load < thresholdPercent && p2.load >= thresholdPercent) {
      const deltaLoad = p2.load - p1.load;
      if (deltaLoad === 0) {
        return p2.time;
      }
      const fraction = (thresholdPercent - p1.load) / deltaLoad;
      const interpolatedMinutes = p1.time + fraction * (p2.time - p1.time);
      return Math.round(interpolatedMinutes * 10) / 10;
    }
  }

  // Threshold was never reached or crossed within the horizon series
  return null;
}
