import { db, isFirebaseAvailable } from './firebase.js';
import { MUMBAI_LOCATIONS, INITIAL_EVENT_DATA } from './data.js';

const DEFAULT_USERS = {
  user_1: {
    id: "user_1",
    name: "Commander Alex",
    email: "alex@ghostprotocol.ai",
    password: "password123",
    role: "City Operations",
    onboarded: true
  }
};

const DEFAULT_ALERTS = [
  {
    id: "alt_1",
    severity: "CRITICAL",
    title: "JWCC area predicted to exceed simulated capacity pressure",
    whatHappened: "Ingress turnstiles at Jio World Convention Centre are clocking 1,400 visitors per minute.",
    whyItMatters: "Entry turnstiles and Avenue 3 access roads will face crush bottlenecks in approximately 45 minutes.",
    whatCanBeDone: "Activate dynamic gate staggering vouchers and redirect incoming flows toward Zone C concourses.",
    time: "3 mins ago"
  },
  {
    id: "alt_2",
    severity: "ATTENTION",
    title: "Trident BKC simulated occupancy approaching threshold",
    whatHappened: "Trident Bandra Kurla is 91% occupied with 1,240 expected VIP and delegation arrivals.",
    whyItMatters: "Front desk check-in queue delay will spill into the porte-cochère and BKC G Block artery.",
    whatCanBeDone: "Open secondary baggage holding and divert excess bookings to Airport transit hotels.",
    time: "9 mins ago"
  },
  {
    id: "alt_3",
    severity: "ATTENTION",
    title: "Transit connection experiencing simulated overload",
    whatHappened: "BKC Metro Line 3 station platform load has reached 91% (predicted 108%).",
    whyItMatters: "Platform safety thresholds will trigger automated gate throttling.",
    whatCanBeDone: "Direct commuter crowds toward Bandra suburban railway terminal feeder buses.",
    time: "15 mins ago"
  },
  {
    id: "alt_4",
    severity: "AI INSIGHT",
    title: "Lower-pressure capacity detected in another zone",
    whatHappened: "Kalina Spillover Zone operates at 45% load with 8,250 empty parking spaces.",
    whyItMatters: "Diverting 15% of Zone A's flow to Zone C slashes overall city stress via spatial rebalancing.",
    whatCanBeDone: "Simulate automated dynamic rebalancing in Operations.",
    time: "20 mins ago"
  }
];

const DEFAULT_PREDICTIONS = [
  {
    id: "pred_zone_a",
    zone: "Zone A (Core Event Precinct - JWCC)",
    current: 110,
    predicted: 125,
    expectedMinutes: 42,
    status: "CRITICAL",
    explanation: "Visitor demand is increasing faster than available capacity.",
    suggestedAction: "Redirect some incoming visitors toward Zone C."
  },
  {
    id: "pred_zone_b",
    zone: "Zone B (Bandra/Santacruz Artery)",
    current: 88,
    predicted: 95,
    expectedMinutes: 55,
    status: "HIGH",
    explanation: "Western Express Highway feeder shuttle queues reaching saturation.",
    suggestedAction: "Reroute selected shuttle traffic through bypass corridors."
  },
  {
    id: "pred_zone_c",
    zone: "Zone C (Airport/Kalina Spillover Hub)",
    current: 52,
    predicted: 45,
    expectedMinutes: null,
    status: "AVAILABLE CAPACITY",
    explanation: "Infrastructure operates at low pressure with 8,250 free parking spaces and 280+ free hotel rooms.",
    suggestedAction: "Zone C can absorb additional visitors."
  }
];

async function seedDatabase() {
  console.log('====================================================');
  console.log('  GHOST PROTOCOL — FIREBASE RTDB SEED UTILITY');
  console.log('====================================================');

  if (!isFirebaseAvailable || !db) {
    console.error('❌ Cannot seed database: Firebase is not initialized or credentials are missing.');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to Firebase Realtime Database...');

    console.log(`⏳ Seeding ${MUMBAI_LOCATIONS.length} Mumbai locations...`);
    await db.ref('locations').set(MUMBAI_LOCATIONS);

    console.log('⏳ Seeding initial mega-event metadata...');
    await db.ref('events').set(INITIAL_EVENT_DATA);

    console.log('⏳ Seeding demo user credentials...');
    await db.ref('users').set(DEFAULT_USERS);

    console.log(`⏳ Seeding ${DEFAULT_ALERTS.length} default priority alerts...`);
    await db.ref('alerts').set(DEFAULT_ALERTS);

    console.log(`⏳ Seeding ${DEFAULT_PREDICTIONS.length} predictive models...`);
    await db.ref('predictions').set(DEFAULT_PREDICTIONS);

    console.log('✅ Firebase Realtime Database seeded successfully!');
    console.log('   - locations/    : ' + MUMBAI_LOCATIONS.length + ' facilities');
    console.log('   - events/       : ' + INITIAL_EVENT_DATA.title);
    console.log('   - users/        : ' + Object.keys(DEFAULT_USERS).length + ' user(s)');
    console.log('   - alerts/       : ' + DEFAULT_ALERTS.length + ' alerts');
    console.log('   - predictions/  : ' + DEFAULT_PREDICTIONS.length + ' predictions');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during Firebase seed operation:', error);
    process.exit(1);
  }
}

seedDatabase();
