/**
 * EVENTTWIN VALIDATION & INTEGRATION TEST SUITE (Phase 1)
 * Tests core simulation engine against all 9 technical credibility requirements.
 */

import {
  getCanonicalBaselineState,
  calculateEventTwinStressIndex,
  simulateScenario,
  buildStateFromLocations
} from './simulationEngine.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log("\n=======================================================");
console.log("   EVENTTWIN SIMULATION ENGINE TEST SUITE (PHASE 1)");
console.log("=======================================================\n");

// --- TEST 1: Stress Index Formula Accuracy ---
console.log("1. Stress Index Formula Verification");
{
  // Test formula: Stress = Mobility * 0.30 + Venue * 0.25 + Parking * 0.20 + Hotel * 0.15 + DemandImbalance * 0.10
  const result = calculateEventTwinStressIndex({
    mobilityLoad: 80,
    venueLoad: 70,
    parkingLoad: 60,
    hotelOccupancy: 50,
    demandImbalance: 40
  });

  // Expected: 80*0.30 (24) + 70*0.25 (17.5) + 60*0.20 (12) + 50*0.15 (7.5) + 40*0.10 (4) = 65.0
  assert(result.compositeStress === 65, "Formula calculates exact weighted composite score (65%)", `Got ${result.compositeStress}`);
  assert(result.breakdown.mobility === 80, "Mobility normalized correctly");
  assert(result.breakdown.venue === 70, "Venue normalized correctly");
}

// --- TEST 2: Increasing Visitors Increases Pressure ---
console.log("\n2. Visitor Scaling Test");
{
  const baseline = simulateScenario(null, { visitorIncreasePct: 0 });
  const surge = simulateScenario(null, { visitorIncreasePct: 40 });

  assert(surge.before.cityStress > baseline.before.cityStress,
    "Increasing visitors from 0% to 40% increases city stress",
    `Base: ${baseline.before.cityStress}%, Surge: ${surge.before.cityStress}%`);

  assert(surge.before.venueLoad > baseline.before.venueLoad,
    "Increasing visitors increases venue load",
    `Base: ${baseline.before.venueLoad}%, Surge: ${surge.before.venueLoad}%`);

  assert(surge.conservation.totalVisitors === 700000,
    "Total visitors scales to exact 700,000 (+40% of 500,000)",
    `Got ${surge.conservation.totalVisitors}`);
}

// --- TEST 3: Rain Increases Mobility Pressure & Causes Ripple Effects ---
console.log("\n3. Rain Ripple Effect Test");
{
  const dry = simulateScenario(null, { rainImpactPct: 0 });
  const heavyRain = simulateScenario(null, { rainImpactPct: 30 });

  assert(heavyRain.rippleEffects.rain.shuttleTravelTimeMinutes > dry.rippleEffects.rain.shuttleTravelTimeMinutes,
    "Rain increases shuttle travel time (slows down road speed)",
    `Dry: ${dry.rippleEffects.rain.shuttleTravelTimeMinutes}m, Rain: ${heavyRain.rippleEffects.rain.shuttleTravelTimeMinutes}m`);

  assert(heavyRain.before.cityStress > dry.before.cityStress,
    "Rain ripple increases overall city stress",
    `Dry: ${dry.before.cityStress}%, Rain: ${heavyRain.before.cityStress}%`);

  assert(heavyRain.rippleEffects.rain.arrivalConcentrationSurgePct > 0,
    "Rain increases arrival concentration waves");
}

// --- TEST 4: Closing Parking Increases Relevant Load ---
console.log("\n4. Parking Reduction Shock Test");
{
  const normalParking = simulateScenario(null, { parkingReductionPct: 0 });
  const reducedParking = simulateScenario(null, { parkingReductionPct: 30 });

  assert(reducedParking.before.parkingLoad > normalParking.before.parkingLoad,
    "Reducing parking capacity increases parking load percentage",
    `Normal: ${normalParking.before.parkingLoad}%, Reduced: ${reducedParking.before.parkingLoad}%`);
}

// --- TEST 5: Visitor Redistribution Conserves Total Visitors ---
console.log("\n5. Visitor Redistribution Conservation Test");
{
  const sim = simulateScenario(null, {
    visitorIncreasePct: 30,
    isRebalanced: true,
    interventions: { visitorDiversionPct: 18 }
  });

  const b = sim.conservation.zoneBreakdownBefore;
  const a = sim.conservation.zoneBreakdownAfter;

  const totalBefore = b.zoneA + b.zoneB + b.zoneC;
  const totalAfter = a.zoneA + a.zoneB + a.zoneC;

  assert(totalBefore === 650000, "Initial visitors conserved at 650,000", `Got ${totalBefore}`);
  assert(totalAfter === 650000, "After rebalancing visitors strictly conserved at 650,000", `Got ${totalAfter}`);
  assert(a.zoneA < b.zoneA, "Zone A visitor count decreased", `Before: ${b.zoneA}, After: ${a.zoneA}`);
  assert(a.zoneC > b.zoneC, "Zone C visitor count increased", `Before: ${b.zoneC}, After: ${a.zoneC}`);
  assert(sim.conservation.isConserved === true, "Conservation flag confirmed true");
}

// --- TEST 6: Parking Redistribution Conserves Total Vehicles ---
console.log("\n6. Parking Redistribution Conservation Test");
{
  const simBefore = simulateScenario(null, { visitorIncreasePct: 20, isRebalanced: false });
  const simAfter = simulateScenario(null, {
    visitorIncreasePct: 20,
    isRebalanced: true,
    interventions: { redistributeParking: true, parkingDiversionPct: 25 }
  });

  const jwccBefore = simBefore.locations.find(l => l.id === "parking_jwcc_onpremise");
  const kalinaBefore = simBefore.locations.find(l => l.id === "parking_kalina_spillover");

  const jwccAfter = simAfter.locations.find(l => l.id === "parking_jwcc_onpremise");
  const kalinaAfter = simAfter.locations.find(l => l.id === "parking_kalina_spillover");

  const parkedBefore = jwccBefore.simulated.currentVisitors + kalinaBefore.simulated.currentVisitors;
  const parkedAfter = jwccAfter.simulated.currentVisitors + kalinaAfter.simulated.currentVisitors;

  assert(parkedBefore === parkedAfter,
    "Total parked vehicles conserved across redistributed facilities",
    `Before: ${parkedBefore}, After: ${parkedAfter}`);

  assert(jwccAfter.simulated.loadPct < jwccBefore.simulated.loadPct,
    "JWCC on-premise parking load relieved",
    `Before: ${jwccBefore.simulated.loadPct}%, After: ${jwccAfter.simulated.loadPct}%`);

  assert(kalinaAfter.simulated.loadPct > kalinaBefore.simulated.loadPct,
    "Kalina overflow lot absorbed surplus vehicles",
    `Before: ${kalinaBefore.simulated.loadPct}%, After: ${kalinaAfter.simulated.loadPct}%`);
}

// --- TEST 7: Interventions Actually Change Underlying State (NO HARDCODED 41%) ---
console.log("\n7. Dynamic Intervention (NO HARDCODED 41%) Test");
{
  // Test mild scenario (+10% visitors)
  const mildScenario = simulateScenario(null, { visitorIncreasePct: 10, isRebalanced: true });
  // Test extreme crisis (+60% visitors, +30% rain, -20% transit)
  const severeScenario = simulateScenario(null, {
    visitorIncreasePct: 60,
    rainImpactPct: 30,
    transitReductionPct: 20,
    isRebalanced: true
  });

  console.log(`    Mild Scenario After Rebalance Stress: ${mildScenario.after.cityStress}%`);
  console.log(`    Severe Scenario After Rebalance Stress: ${severeScenario.after.cityStress}%`);

  assert(mildScenario.after.cityStress !== 41 || severeScenario.after.cityStress !== 41,
    "Stress does NOT default to hardcoded 41%");

  assert(mildScenario.after.cityStress < severeScenario.after.cityStress,
    "Severe scenario has higher rebalanced stress than mild scenario",
    `Mild: ${mildScenario.after.cityStress}%, Severe: ${severeScenario.after.cityStress}%`);

  assert(mildScenario.reduction.cityStress > 0,
    "Measurable positive stress reduction produced",
    `Reduction: ${mildScenario.reduction.cityStress}%`);
}

// --- TEST 8: Deterministic Engine (Same input -> Same output) ---
console.log("\n8. Determinism Test");
{
  const run1 = simulateScenario(null, { visitorIncreasePct: 25, rainImpactPct: 15, isRebalanced: true });
  const run2 = simulateScenario(null, { visitorIncreasePct: 25, rainImpactPct: 15, isRebalanced: true });

  assert(run1.before.cityStress === run2.before.cityStress, "Before city stress matches exactly across runs");
  assert(run1.after.cityStress === run2.after.cityStress, "After city stress matches exactly across runs");
  assert(run1.before.venueLoad === run2.before.venueLoad, "Venue load matches across runs");
}

// --- TEST 9: No Impossible Capacity or Load Values ---
console.log("\n9. Capacity & Bounds Validation Test");
{
  const extreme = simulateScenario(null, {
    visitorIncreasePct: 100,
    transitReductionPct: 50,
    parkingReductionPct: 50,
    shuttleReductionPct: 50,
    rainImpactPct: 50,
    venueDelayMinutes: 60,
    isRebalanced: true
  });

  extreme.locations.forEach(loc => {
    assert(loc.simulated.capacity > 0, `Capacity must be > 0 for ${loc.name}`, `Got ${loc.simulated.capacity}`);
    assert(!isNaN(loc.simulated.loadPct), `Load % must not be NaN for ${loc.name}`);
    assert(loc.simulated.currentVisitors >= 0, `Demand must be >= 0 for ${loc.name}`);
  });

  assert(extreme.after.cityStress >= 0 && extreme.after.cityStress <= 100,
    "Stress Index remains bounded in [0, 100]",
    `Got ${extreme.after.cityStress}`);
}

// --- TEST 10: Complete Hackathon Demo Flow ---
console.log("\n10. Complete Hackathon Demo Flow Test");
{
  // 1. Baseline: 500K visitors
  const base = getCanonicalBaselineState();
  console.log(`    Step 1: Baseline 500K visitors -> Stress: ${base.state.stressIndex}%`);
  assert(base.state.totalVisitors === 500000, "Baseline has 500K visitors");

  // 2. Crisis: +30% visitors, +20% rain, -10% transit
  const crisis = simulateScenario(null, {
    visitorIncreasePct: 30,
    rainImpactPct: 20,
    transitReductionPct: 10,
    venueDelayMinutes: 15,
    isRebalanced: false
  });
  console.log(`    Step 2: Crisis (+30% visitors, +20% rain, -10% transit) -> Stress: ${crisis.before.cityStress}%`);
  console.log(`            Venue Load: ${crisis.before.venueLoad}%, Transit Load: ${crisis.before.transitLoad}%, Parking Load: ${crisis.before.parkingLoad}%`);
  assert(crisis.before.cityStress > base.state.stressIndex, "Crisis stress elevated over baseline");
  assert(crisis.before.venueLoad > 100, "Venue reaches overload (>100%)");

  // 3. Ripple effects present
  assert(crisis.rippleEffects.rain.shuttleTravelTimeMinutes > 15, "Ripple: Shuttle travel time increased");
  assert(crisis.rippleEffects.venueGate.effectiveCapacityPct < 100, "Ripple: Venue ingress capacity reduced");

  // 4. Interventions & Recalculate
  const rebalanced = simulateScenario(null, {
    visitorIncreasePct: 30,
    rainImpactPct: 20,
    transitReductionPct: 10,
    venueDelayMinutes: 15,
    isRebalanced: true
  });
  console.log(`    Step 3: Rebalanced -> Stress: ${rebalanced.after.cityStress}% (Reduction: ${rebalanced.reduction.cityStress} pts)`);
  console.log(`            Venue: ${rebalanced.before.venueLoad}% -> ${rebalanced.after.venueLoad}%`);
  console.log(`            Transit: ${rebalanced.before.transitLoad}% -> ${rebalanced.after.transitLoad}%`);
  console.log(`            Parking: ${rebalanced.before.parkingLoad}% -> ${rebalanced.after.parkingLoad}%`);

  assert(rebalanced.after.cityStress < rebalanced.before.cityStress, "Rebalancing reduces stress");
  assert(rebalanced.after.venueLoad < rebalanced.before.venueLoad, "Rebalancing relieves venue load");
  assert(rebalanced.explainability.why.length > 0, "Explainable WHY present");
  assert(rebalanced.explainability.action.length > 0, "Explainable ACTION present");
  assert(rebalanced.explainability.tradeOff.length > 0, "Explainable TRADE-OFF present");
}

console.log("\n=======================================================");
console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log("=======================================================\n");
