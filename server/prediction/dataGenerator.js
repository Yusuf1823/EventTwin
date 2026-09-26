/**
 * EVENTTWIN PREDICTION TRAINING DATA GENERATOR
 * Generates synthetic training datasets by driving Phase 1's simulationEngine.js (simulateScenario).
 * 
 * CLI Usage:
 *   node server/prediction/dataGenerator.js --count 20000 --out server/prediction/data/training_data.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { simulateScenario } from '../simulationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for bounded random integer [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper for bounded random float [min, max]
function randFloat(min, max, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

// Event phases modeled in mega-events
const EVENT_PHASES = ['INGRESS', 'PEAK', 'EGRESS'];

/**
 * Generate a single synthetic record by driving simulateScenario
 */
function generateRecord() {
  // 1. Sample inputs within specified ranges
  const visitorCount = randInt(300000, 700000);
  const visitorGrowth = randInt(0, 20); // visitorGrowthPct: 0-20
  const rainFactor = randInt(0, 100); // rainImpactPct: 0-100
  const transitDisruption = randInt(0, 50); // transitReductionPct: 0-50
  const parkingReduction = randInt(0, 40); // parkingReductionPct: 0-40
  const venueDelay = randInt(0, 30); // venueDelayMinutes: 0-30
  const entrySurgePct = randFloat(0, 30, 1); // entrySurgePct: 0-30
  const eventPhase = EVENT_PHASES[randInt(0, EVENT_PHASES.length - 1)];

  // 2. Zone distribution variation around baseline (52% A, 30% B, 18% C)
  const rawA = 0.40 + Math.random() * 0.25; // 40% - 65%
  const rawB = 0.20 + Math.random() * 0.15; // 20% - 35%
  const rawC = 0.10 + Math.random() * 0.15; // 10% - 25%
  const sumWeights = rawA + rawB + rawC;

  const splitA = rawA / sumWeights;
  const splitB = rawB / sumWeights;

  const zoneADemand = Math.round(visitorCount * splitA);
  const zoneBDemand = Math.round(visitorCount * splitB);
  // Strict conservation of total visitors
  const zoneCDemand = visitorCount - zoneADemand - zoneBDemand;

  // 3. Drive Phase 1 simulationEngine with sampled disruption parameters
  const visitorIncreasePct = Math.max(0, Math.round(((visitorCount - 500000) / 500000) * 100));

  const simResult = simulateScenario(null, {
    visitorIncreasePct,
    rainImpactPct: rainFactor,
    transitReductionPct: transitDisruption,
    parkingReductionPct: parkingReduction,
    venueDelayMinutes: venueDelay
  });

  // 4. Derive current facility loads using simulation results + scenario multipliers
  const baseSimulatedVisitors = simResult.conservation.totalVisitors;
  const vScale = visitorCount / baseSimulatedVisitors;
  const zoneAScale = (visitorCount * splitA) / (baseSimulatedVisitors * 0.52);

  // Ingress surge heavily impacts venue turnstiles during INGRESS, moderately at PEAK
  const surgeMultiplier = eventPhase === 'INGRESS'
    ? (1.0 + entrySurgePct / 100.0)
    : eventPhase === 'PEAK'
    ? (1.0 + (entrySurgePct / 100.0) * 0.45)
    : 1.0;

  const venueLoad = Math.max(0, Math.round(simResult.before.venueLoad * zoneAScale * surgeMultiplier));

  // Transit load varies by event phase (high during ingress and peak departures)
  const phaseTransitMult = eventPhase === 'INGRESS'
    ? (1.0 + (entrySurgePct / 100.0) * 0.20)
    : eventPhase === 'EGRESS'
    ? 1.15
    : 0.95;
  const transitLoad = Math.max(0, Math.round(simResult.before.transitLoad * vScale * phaseTransitMult));

  // Parking load dynamics (peak occupancy mid-event, holding through egress)
  const phaseParkingMult = eventPhase === 'INGRESS'
    ? 1.0
    : eventPhase === 'PEAK'
    ? 1.06
    : 0.94;
  const parkingLoad = Math.max(0, Math.round(simResult.before.parkingLoad * vScale * phaseParkingMult));

  // Hotel occupancy scales sublinearly with visitor volume
  const hotelLoad = Math.min(100, Math.max(0, Math.round(simResult.before.hotelOccupancy * (vScale ** 0.5))));

  // 5. Run forward in time to model future state (applying visitor growth & temporal shifts)
  const futureVisitors = Math.round(visitorCount * (1.0 + visitorGrowth / 100.0));

  // Forward temporal shift in zone split based on phase progression
  let futureRawA = splitA;
  let futureRawB = splitB;
  let futureRawC = 1.0 - splitA - splitB;

  if (eventPhase === 'INGRESS') {
    // Continued concentration into Zone A Core Precinct
    futureRawA += randFloat(0.01, 0.03, 3);
  } else if (eventPhase === 'PEAK') {
    // Core stabilizes, spillover to Zone C begins
    futureRawC += randFloat(0.01, 0.03, 3);
  } else if (eventPhase === 'EGRESS') {
    // Dispersal away from Zone A toward Zone B and C transit arteries
    futureRawA -= randFloat(0.02, 0.05, 3);
    futureRawB += randFloat(0.01, 0.03, 3);
    futureRawC += randFloat(0.01, 0.03, 3);
  }

  const futureSum = futureRawA + futureRawB + futureRawC;
  const futureSplitA = futureRawA / futureSum;
  const futureSplitB = futureRawB / futureSum;

  const futureZoneADemand = Math.round(futureVisitors * futureSplitA);
  const futureZoneBDemand = Math.round(futureVisitors * futureSplitB);
  // Strict conservation for future state
  const futureZoneCDemand = futureVisitors - futureZoneADemand - futureZoneBDemand;

  return {
    visitor_count: visitorCount,
    zone_a_demand: zoneADemand,
    zone_b_demand: zoneBDemand,
    zone_c_demand: zoneCDemand,
    venue_load: venueLoad,
    transit_load: transitLoad,
    parking_load: parkingLoad,
    hotel_load: hotelLoad,
    rain_factor: rainFactor,
    transit_disruption: transitDisruption,
    parking_reduction: parkingReduction,
    venue_delay: venueDelay,
    visitor_growth: visitorGrowth,
    event_phase: eventPhase,
    future_zone_a_demand: futureZoneADemand,
    future_zone_b_demand: futureZoneBDemand,
    future_zone_c_demand: futureZoneCDemand
  };
}

/**
 * CLI Argument parser
 */
function parseCliArgs() {
  const args = process.argv.slice(2);
  let count = 20000;
  let outPath = path.resolve(__dirname, 'data', 'training_data.csv');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        count = parsed;
      }
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outPath = path.isAbsolute(args[i + 1])
        ? args[i + 1]
        : path.resolve(process.cwd(), args[i + 1]);
      i++;
    }
  }

  return { count, outPath };
}

/**
 * Main generator execution
 */
async function main() {
  const { count, outPath } = parseCliArgs();

  console.log(`\n======================================================`);
  console.log(`   EVENTTWIN SYNTHETIC PREDICTION DATA GENERATOR`);
  console.log(`======================================================`);
  console.log(`Target count: ${count.toLocaleString()} rows`);
  console.log(`Output file : ${outPath}`);
  console.log(`Driving     : Phase 1 simulationEngine.js (simulateScenario)\n`);

  // Ensure target directory exists
  const targetDir = path.dirname(outPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const columns = [
    'visitor_count',
    'zone_a_demand',
    'zone_b_demand',
    'zone_c_demand',
    'venue_load',
    'transit_load',
    'parking_load',
    'hotel_load',
    'rain_factor',
    'transit_disruption',
    'parking_reduction',
    'venue_delay',
    'visitor_growth',
    'event_phase',
    'future_zone_a_demand',
    'future_zone_b_demand',
    'future_zone_c_demand'
  ];

  const startTime = Date.now();
  const writeStream = fs.createWriteStream(outPath, { encoding: 'utf8' });

  // Write CSV Header
  writeStream.write(columns.join(',') + '\n');

  const previewRows = [];
  const BATCH_SIZE = 1000;
  let batchBuffer = '';

  for (let i = 0; i < count; i++) {
    const record = generateRecord();

    const row = columns.map(col => record[col]).join(',');
    batchBuffer += row + '\n';

    if (previewRows.length < 3) {
      previewRows.push(record);
    }

    if ((i + 1) % BATCH_SIZE === 0 || i === count - 1) {
      writeStream.write(batchBuffer);
      batchBuffer = '';
    }
  }

  await new Promise((resolve, reject) => {
    writeStream.end(() => resolve());
    writeStream.on('error', reject);
  });

  const durationMs = Date.now() - startTime;
  console.log(`✅ Successfully generated ${count.toLocaleString()} rows in ${(durationMs / 1000).toFixed(2)}s\n`);

  console.log(`--- 3-ROW PREVIEW ---`);
  console.table(previewRows);

  console.log(`\nSample CSV Lines:`);
  console.log(columns.join(','));
  previewRows.forEach(r => {
    console.log(columns.map(c => r[c]).join(','));
  });
  console.log(`---------------------\n`);
}

// Execute when run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('dataGenerator.js')) {
  main().catch(err => {
    console.error('Fatal error during data generation:', err);
    process.exit(1);
  });
}

export { generateRecord, main };
