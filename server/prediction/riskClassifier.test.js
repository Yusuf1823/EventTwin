/**
 * ASSERT-BASED UNIT TESTS: riskClassifier.js
 * Tests classification bands (LOW, MODERATE, HIGH, CRITICAL) and timeToThreshold interpolation.
 */

import { classifyRisk, timeToThreshold } from './riskClassifier.js';

let passed = 0;
let total = 0;

function assertEqual(actual, expected, testName) {
  total++;
  if (actual === expected) {
    passed++;
    console.log(`  ✅ PASS: ${testName} -> ${actual}`);
  } else {
    console.error(`  ❌ FAIL: ${testName} | Expected: ${expected}, Actual: ${actual}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log('\n======================================================');
console.log('   RISK CLASSIFIER & TIME-TO-THRESHOLD TESTS');
console.log('======================================================\n');

// 1. Classification Bands
console.log('Testing classifyRisk bands:');
assertEqual(classifyRisk(55), 'LOW', 'Load < 70% is LOW');
assertEqual(classifyRisk(69.9), 'LOW', 'Load 69.9% is LOW');
assertEqual(classifyRisk(70), 'MODERATE', 'Load 70% is MODERATE');
assertEqual(classifyRisk(80), 'MODERATE', 'Load 80% is MODERATE');
assertEqual(classifyRisk(85), 'HIGH', 'Load 85% is HIGH');
assertEqual(classifyRisk(95), 'HIGH', 'Load 95% is HIGH');
assertEqual(classifyRisk(100), 'HIGH', 'Load 100% is HIGH');
assertEqual(classifyRisk(100.1), 'CRITICAL', 'Load > 100% is CRITICAL');
assertEqual(classifyRisk(125), 'CRITICAL', 'Load 125% is CRITICAL');

// 2. Time to Threshold Linear Interpolation
console.log('\nTesting timeToThreshold linear interpolation:');

// Case A: Midpoint crossing between 15m (90%) and 30m (110%)
// Threshold 100%: frac = (100-90)/(110-90) = 0.5 -> 15 + 0.5 * 15 = 22.5m
assertEqual(
  timeToThreshold(80, [90, 110, 130], [15, 30, 45], 100),
  22.5,
  'Crossing between 15m (90%) and 30m (110%) at 100% yields 22.5m'
);

// Case B: Early crossing between 0m (80%) and 15m (100%)
// Threshold 90%: frac = (90-80)/(100-80) = 0.5 -> 0 + 0.5 * 15 = 7.5m
assertEqual(
  timeToThreshold(80, [100, 120, 140], [15, 30, 45], 90),
  7.5,
  'Crossing between 0m (80%) and 15m (100%) at 90% yields 7.5m'
);

// Case C: Already at or above threshold at t = 0
assertEqual(
  timeToThreshold(105, [110, 120, 130], [15, 30, 45], 100),
  0,
  'Current load already above threshold yields 0m'
);

// Case D: Never reaches threshold across all horizons
assertEqual(
  timeToThreshold(50, [60, 70, 80], [15, 30, 45], 100),
  null,
  'Load that never reaches threshold yields null'
);

// Case E: Object-based horizon map input ({ "15min": 80, "30min": 90, "45min": 105 })
// Crossing between 30m (90%) and 45m (105%) at 100%: frac = 10/15 -> 30 + 10 = 40m
assertEqual(
  timeToThreshold(70, { '15min': 80, '30min': 90, '45min': 105 }, [15, 30, 45], 100),
  40,
  'Object-keyed horizon map crossing between 30m and 45m yields 40m'
);

console.log(`\n======================================================`);
console.log(`   ALL ${passed}/${total} RISK CLASSIFIER TESTS PASSED!`);
console.log(`======================================================\n`);
