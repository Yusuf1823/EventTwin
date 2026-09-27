/**
 * STANDALONE TEST SCRIPT: Prediction Service & Fallback Forecast Validation
 * Verifies predictFuture() output shape, fallback behavior, and conservation laws.
 */

import { predictFuture } from './predictionService.js';
import { getCanonicalBaselineState } from '../simulationEngine.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   EVENTTWIN PREDICTION SERVICE VERIFICATION');
  console.log('======================================================\n');

  const baselineState = getCanonicalBaselineState().state;
  const scenario = {
    visitorGrowthPct: 12,
    rainImpactPct: 30,
    transitReductionPct: 20,
    parkingReductionPct: 15,
    venueDelayMinutes: 10
  };

  // 1. Run prediction with default horizons [15, 30, 45]
  console.log('Test 1: predictFuture with default horizons [15, 30, 45]');
  const result = await predictFuture(baselineState, scenario);

  assert(result !== null && typeof result === 'object', 'Result is an object');
  assert(result.source === 'ml' || result.source === 'fallback-simulation', `Source truthfully identified as "ml" or "fallback-simulation" (actual: ${result.source})`);
  assert('15min' in result, 'Contains "15min" horizon');
  assert('30min' in result, 'Contains "30min" horizon');
  assert('45min' in result, 'Contains "45min" horizon');

  // 2. Validate horizon shape and physical conservation
  console.log('\nTest 2: Validate individual horizon output shapes & conservation');
  for (const h of ['15min', '30min', '45min']) {
    const horizonData = result[h];
    assert(typeof horizonData.totalVisitors === 'number', `${h}: totalVisitors is number`);
    assert(typeof horizonData.isML === 'boolean', `${h}: isML is boolean (actual: ${horizonData.isML})`);
    assert(horizonData.method === 'ML_NEURAL_NETWORK' || horizonData.method === 'NEURAL_NETWORK_PREDICTION' || horizonData.method === 'DETERMINISTIC_SIMULATION_EXTRAPOLATION', `${h}: valid prediction method (actual: ${horizonData.method})`);

    // Verify physical conservation
    const zb = horizonData.zoneBreakdown;
    assert(zb.zoneA + zb.zoneB + zb.zoneC === horizonData.totalVisitors, `${h}: Strict visitor conservation preserved (ZoneA + ZoneB + ZoneC === totalVisitors)`);

    // Verify loads
    const loads = horizonData.loads;
    assert(typeof loads.venueLoad === 'number', `${h}: venueLoad is number (${loads.venueLoad}%)`);
    assert(typeof loads.transitLoad === 'number', `${h}: transitLoad is number (${loads.transitLoad}%)`);
    assert(typeof loads.parkingLoad === 'number', `${h}: parkingLoad is number (${loads.parkingLoad}%)`);
    assert(typeof loads.hotelOccupancy === 'number', `${h}: hotelOccupancy is number (${loads.hotelOccupancy}%)`);
    assert(typeof horizonData.stressIndex === 'number', `${h}: stressIndex is number (${horizonData.stressIndex})`);

    // Verify predictions array
    assert(Array.isArray(horizonData.predictions) && horizonData.predictions.length === 3, `${h}: predictions contains 3 zone predictions`);
  }

  // 3. Test progression over time (45m should project higher impact than 15m)
  console.log('\nTest 3: Temporal progression dynamics');
  assert(result['45min'].totalVisitors > result['15min'].totalVisitors, '45m total visitors > 15m total visitors under positive growth');
  assert(result['45min'].loads.venueLoad >= result['15min'].loads.venueLoad, '45m venue load >= 15m venue load under delay and influx');

  // 4. Test custom horizons
  console.log('\nTest 4: Custom horizons [10, 60]');
  const customResult = await predictFuture(baselineState, scenario, [10, 60]);
  assert('10min' in customResult, 'Custom 10min horizon present');
  assert('60min' in customResult, 'Custom 60min horizon present');
  assert(!('15min' in customResult), 'Default 15min not present in custom call');

  console.log(`\n======================================================`);
  console.log(`   ALL ${passed}/${total} PREDICTION TESTS PASSED!`);
  console.log(`======================================================\n`);

  console.log('Sample Output Structure:');
  console.log(JSON.stringify({
    source: result.source,
    '15min': {
      projectedTime: result['15min'].projectedTime,
      totalVisitors: result['15min'].totalVisitors,
      zoneBreakdown: result['15min'].zoneBreakdown,
      loads: result['15min'].loads,
      stressIndex: result['15min'].stressIndex
    },
    '30min': {
      projectedTime: result['30min'].projectedTime,
      totalVisitors: result['30min'].totalVisitors,
      loads: result['30min'].loads,
      stressIndex: result['30min'].stressIndex
    },
    '45min': {
      projectedTime: result['45min'].projectedTime,
      totalVisitors: result['45min'].totalVisitors,
      loads: result['45min'].loads,
      stressIndex: result['45min'].stressIndex
    }
  }, null, 2));
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
