/**
 * EVENTTWIN CAUSAL EXPLANATION GENERATOR
 * Generates transparent, human-readable causal explanations from actual applied scenario deltas.
 * 
 * NOTE ON DATA HONESTY:
 * Do NOT compute or display SHAP values or pseudo feature-importance scores here.
 * We do not have a trained ML model plugged in yet.
 * 
 * TODO: SWAP IN REAL FEATURE IMPORTANCES / SHAP VALUES HERE ONCE THE TRAINED ML MODEL IS INTEGRATED.
 * When the ML model in predictWithModel() is plugged in, extract its TreeSHAP / KernelSHAP
 * feature attribution vectors here instead of the deterministic diff heuristic below.
 */

/**
 * Generates structured explanation and contributors list for a projected bottleneck
 * 
 * @param {Object} scenarioDeltas - Plain object of applied scenario inputs/diffs
 * @param {string} predictedResource - Resource name (e.g. "Zone A", "Venue")
 * @param {number} predictedLoad - Projected load percentage
 * @param {number | null} minutesUntilCritical - Minutes until reaching threshold
 * @returns {{ contributors: Array<{ factor: string, label: string, magnitude: number, direction: string }>, text: string }}
 */
export function generateExplanation(scenarioDeltas = {}, predictedResource = 'Zone A', predictedLoad = 100, minutesUntilCritical = null) {
  const candidateFactors = [];

  // 1. Visitor Inflow Delta
  const visitorPct = scenarioDeltas.visitorIncreasePct ?? scenarioDeltas.visitorInflowPct ?? scenarioDeltas.visitorGrowthPct ?? 0;
  if (visitorPct > 0) {
    candidateFactors.push({
      factor: 'visitor_inflow',
      label: `Visitor inflow (+${visitorPct}%)`,
      magnitude: visitorPct,
      direction: 'positive',
      summary: `heightened visitor inflow (+${visitorPct}%)`
    });
  }

  // 2. Monsoon Rain Impact
  const rainPct = scenarioDeltas.rainImpactPct ?? scenarioDeltas.rain_factor ?? 0;
  if (rainPct > 0) {
    candidateFactors.push({
      factor: 'rain_impact',
      label: `Rain impact (${rainPct}%)`,
      magnitude: rainPct,
      direction: 'positive',
      summary: `monsoon road & shuttle choke (${rainPct}% rain impact)`
    });
  }

  // 3. Transit Capacity Disruption
  const transitPct = scenarioDeltas.transitReductionPct ?? scenarioDeltas.transitDisruptionPct ?? scenarioDeltas.transit_disruption ?? 0;
  if (transitPct > 0) {
    candidateFactors.push({
      factor: 'transit_disruption',
      label: `Transit reduction (-${transitPct}%)`,
      magnitude: transitPct,
      direction: 'negative',
      summary: `transit disruption (-${transitPct}% capacity)`
    });
  }

  // 4. Gate Throughput / Venue Ingress Delay
  const venueDelay = scenarioDeltas.venueDelayMinutes ?? scenarioDeltas.venue_delay ?? 0;
  if (venueDelay > 0) {
    // Gate capacity multiplier = 1 / (1 + delay/60 * 0.45)
    const throughputDropPct = Math.round((1 - (1 / (1 + (venueDelay / 60.0) * 0.45))) * 100);
    candidateFactors.push({
      factor: 'gate_throughput_delay',
      label: `Gate throughput drop (-${throughputDropPct}%)`,
      magnitude: throughputDropPct,
      direction: 'negative',
      summary: `gate ingress delay (-${throughputDropPct}% throughput from ${venueDelay}m delay)`
    });
  }

  // 5. Parking Capacity Reduction
  const parkingPct = scenarioDeltas.parkingReductionPct ?? scenarioDeltas.parking_reduction ?? 0;
  if (parkingPct > 0) {
    candidateFactors.push({
      factor: 'parking_reduction',
      label: `Parking reduction (-${parkingPct}%)`,
      magnitude: parkingPct,
      direction: 'negative',
      summary: `parking availability reduction (-${parkingPct}%)`
    });
  }

  // 6. Arrival Entry Surge
  const surgePct = scenarioDeltas.entrySurgePct ?? 0;
  if (surgePct > 0) {
    candidateFactors.push({
      factor: 'entry_surge',
      label: `Arrival entry surge (+${surgePct}%)`,
      magnitude: surgePct,
      direction: 'positive',
      summary: `arrival concentration wave (+${surgePct}%)`
    });
  }

  // Sort strictly by magnitude and select top 2–3
  candidateFactors.sort((a, b) => b.magnitude - a.magnitude);
  const topContributors = candidateFactors.slice(0, 3);

  // Build natural language explanation text
  let explanationText = '';
  const resourceName = predictedResource || 'Zone A';
  const loadText = `${predictedLoad}%`;

  if (topContributors.length === 0) {
    explanationText = `${resourceName} is projected at ${loadText} under baseline operating conditions.`;
  } else {
    const contributorPhrases = topContributors.map(c => c.summary);
    let causesText = '';
    if (contributorPhrases.length === 1) {
      causesText = contributorPhrases[0];
    } else if (contributorPhrases.length === 2) {
      causesText = `${contributorPhrases[0]} and ${contributorPhrases[1]}`;
    } else {
      causesText = `${contributorPhrases[0]}, ${contributorPhrases[1]}, and ${contributorPhrases[2]}`;
    }

    if (minutesUntilCritical !== null && minutesUntilCritical > 0) {
      explanationText = `${resourceName} is predicted to reach ${loadText} in ${minutesUntilCritical} minutes because of ${causesText}.`;
    } else if (minutesUntilCritical === 0) {
      explanationText = `${resourceName} is at critical capacity (${loadText}) driven by ${causesText}.`;
    } else {
      explanationText = `${resourceName} is projected to reach ${loadText} primarily due to ${causesText}.`;
    }
  }

  return {
    contributors: topContributors.map(c => ({
      factor: c.factor,
      label: c.label,
      magnitude: c.magnitude,
      direction: c.direction
    })),
    text: explanationText
  };
}
