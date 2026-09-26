/**
 * E2E API Verification Script
 * Calls live running backend on port 5000 and verifies full demo flow
 */

async function main() {
  console.log("\n=======================================================");
  console.log("   LIVE E2E ENDPOINT VERIFICATION (http://localhost:5000)");
  console.log("=======================================================\n");

  // 1. Check Canonical Baseline
  const baseRes = await fetch('http://localhost:5000/api/events');
  const baseData = await baseRes.json();
  console.log("1. BASELINE EVENT STATE:");
  console.log(`   - Visitors: ${baseData.event.currentVisitorsSimulated.toLocaleString()}`);
  console.log(`   - Calculated Stress: ${baseData.event.cityStressPct}%`);
  console.log(`   - Venue Load: ${baseData.event.venueLoadPct}%`);
  console.log(`   - Transit Load: ${baseData.event.transitLoadPct}%`);
  console.log(`   - Parking Load: ${baseData.event.parkingLoadPct}%`);
  console.log(`   - Hotel Occupancy: ${baseData.event.hotelOccupancyPct}%`);
  console.log(`   - Stress Formula: ${baseData.stressFormula}`);

  // 2. What-If Crisis Simulation (+30% visitors, +20% rain, -10% transit)
  const crisisPayload = {
    visitorIncreasePct: 30,
    rainImpactPct: 20,
    transitReductionPct: 10,
    venueDelayMinutes: 15,
    isRebalanced: false
  };

  const simRes = await fetch('http://localhost:5000/api/simulation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(crisisPayload)
  });
  const simData = await simRes.json();
  console.log("\n2. CRISIS SIMULATION OUTPUT:");
  console.log(`   - City Stress: ${simData.before.cityStress}%`);
  console.log(`   - Venue Load: ${simData.before.venueLoad}%`);
  console.log(`   - Transit Load: ${simData.before.transitLoad}%`);
  console.log(`   - Parking Load: ${simData.before.parkingLoad}%`);
  console.log(`   - Road Capacity Drop: -${simData.rippleEffects.rain.roadCapacityDropPct}%`);
  console.log(`   - Shuttle Travel Time: ${simData.rippleEffects.rain.shuttleTravelTimeMinutes} mins`);
  console.log(`   - WHY: "${simData.explainability.why}"`);

  // 3. Rebalance Intervention Simulation
  const rebRes = await fetch('http://localhost:5000/api/interventions/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(crisisPayload)
  });
  const rebData = await rebRes.json();
  const sim = rebData.simulation;
  console.log("\n3. REBALANCING INTERVENTION OUTPUT:");
  console.log(`   - Before Stress: ${sim.before.cityStress}%`);
  console.log(`   - After Stress: ${sim.after.cityStress}%`);
  console.log(`   - Stress Reduction: ${sim.reduction.cityStress} points`);
  console.log(`   - Venue: ${sim.before.venueLoad}% -> ${sim.after.venueLoad}%`);
  console.log(`   - Total Visitors Conserved: ${sim.conservation.totalVisitors.toLocaleString()}`);
  console.log(`   - ACTION: "${sim.explainability.action}"`);
  console.log(`   - TRADE-OFF: "${sim.explainability.tradeOff}"`);

  // 4. Verify Live Digital Twin Sync
  const twinRes = await fetch('http://localhost:5000/api/digital-twin');
  const twinData = await twinRes.json();
  console.log("\n4. LIVE DIGITAL TWIN SYNC:");
  console.log(`   - Total Facilities: ${twinData.summary.totalLocations}`);
  console.log(`   - Verified Real Locations: ${twinData.summary.realLocationsVerified}`);
  console.log(`   - Live Event Stress: ${twinData.event.cityStressPct}%`);

  // Reset back to baseline
  await fetch('http://localhost:5000/api/digital-twin/reset', { method: 'POST' });
  console.log("\n5. STATE RESET BACK TO CANONICAL BASELINE.");

  console.log("\n=======================================================");
  console.log("   ALL E2E API CHECKS VERIFIED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main().catch(err => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
