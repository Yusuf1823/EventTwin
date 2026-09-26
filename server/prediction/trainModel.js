/**
 * EVENTTWIN MODEL TRAINING CLI
 * 
 * Usage:
 *   node server/prediction/trainModel.js
 *   node server/prediction/trainModel.js --iterations 500 --samples 10000
 * 
 * This script:
 *   1. Loads the CSV training data from data/training_data.csv
 *   2. Trains a brain.js neural network
 *   3. Saves trained weights to data/model_weights.json
 *   4. Saves normalization params to data/norm_params.json
 *   5. Validates on holdout samples
 * 
 * After training, the server will auto-detect the model on next startup
 * and switch source from "fallback-simulation" to "ml".
 */

import { trainModel } from './mlModel.js';

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--iterations' && args[i + 1]) {
    options.iterations = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--samples' && args[i + 1]) {
    options.maxSamples = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--lr' && args[i + 1]) {
    options.learningRate = parseFloat(args[i + 1]);
    i++;
  } else if (args[i] === '--error' && args[i + 1]) {
    options.errorThresh = parseFloat(args[i + 1]);
    i++;
  } else if (args[i] === '--quiet') {
    options.log = false;
  }
}

console.log('╔══════════════════════════════════════════╗');
console.log('║    EVENTTWIN AI MODEL TRAINER            ║');
console.log('║    brain.js Neural Network               ║');
console.log('╚══════════════════════════════════════════╝');
console.log(`\nOptions: ${JSON.stringify(options, null, 2)}\n`);

try {
  const result = await trainModel(options);
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║    ✅ TRAINING COMPLETE                  ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Final Error  : ${result.error.toFixed(6).padEnd(23)}║`);
  console.log(`║  Iterations   : ${String(result.iterations).padEnd(23)}║`);
  console.log(`║  Duration     : ${(result.durationSec + 's').padEnd(23)}║`);
  console.log(`║  Model saved  : model_weights.json       ║`);
  console.log(`║  Norm params  : norm_params.json          ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n🎯 Next step: Restart the backend server (node index.js)');
  console.log('   The server will auto-detect the trained model.');
  console.log('   API source will change: "fallback-simulation" → "ml"\n');
  
} catch (err) {
  console.error('\n❌ Training failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
