import express from 'express';
import cors from 'cors';
import { db, isFirebaseAvailable } from './firebase.js';
import {
  getCanonicalBaselineState,
  simulateScenario,
  generatePredictionsFromState,
  generateAlertsFromState,
  calculateEventTwinStressIndex,
  buildStateFromLocations,
  BASELINE_TOTAL_VISITORS
} from './simulationEngine.js';
import { predictionRouter } from './prediction/predictionRoutes.js';
import { loadModel } from './prediction/predictionService.js';
import { saveEventConfig, getEventConfig, initializeStateFromConfig } from './eventConfig.js';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Canonical Baseline
const baseline = getCanonicalBaselineState();
let memoryEventData = { ...baseline.eventMeta };
let memoryLocations = JSON.parse(JSON.stringify(baseline.locations));
let memoryCanonicalState = baseline.state;

let memoryUsers = [
  {
    id: "user_1",
    name: "Commander Alex",
    email: "alex@ghostprotocol.ai",
    password: "password123",
    role: "City Operations",
    onboarded: true
  }
];

// ==========================================
// FIREBASE RTDB ACCESS HELPERS WITH IN-MEMORY FALLBACK
// ==========================================

async function getEventsData() {
  if (isFirebaseAvailable && db) {
    try {
      const snap = await db.ref('events').once('value');
      const val = snap.val();
      if (val) return val;
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to read events/, using in-memory fallback:', err.message);
    }
  }
  return memoryEventData;
}

async function saveEventsData(updates) {
  Object.assign(memoryEventData, updates);
  if (isFirebaseAvailable && db) {
    try {
      await db.ref('events').update(updates);
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to update events/:', err.message);
    }
  }
}

async function getLocationsData() {
  if (isFirebaseAvailable && db) {
    try {
      const snap = await db.ref('locations').once('value');
      const val = snap.val();
      if (val) {
        return Array.isArray(val) ? val : Object.values(val);
      }
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to read locations/, using in-memory fallback:', err.message);
    }
  }
  return memoryLocations;
}

async function saveLocationsData(locations) {
  memoryLocations = locations;
  if (isFirebaseAvailable && db) {
    try {
      await db.ref('locations').set(locations);
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to save locations/:', err.message);
    }
  }
}

async function getUsersData() {
  if (isFirebaseAvailable && db) {
    try {
      const snap = await db.ref('users').once('value');
      const val = snap.val();
      if (val) {
        return Array.isArray(val) ? val : Object.values(val);
      }
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to read users/, using in-memory fallback:', err.message);
    }
  }
  return memoryUsers;
}

async function saveUser(user) {
  const existingIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingIdx >= 0) {
    memoryUsers[existingIdx] = user;
  } else {
    memoryUsers.push(user);
  }

  if (isFirebaseAvailable && db) {
    try {
      await db.ref(`users/${user.id}`).set(user);
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to persist user in users/:', err.message);
    }
  }
}

async function updateUser(userId, updates) {
  const user = memoryUsers.find(u => u.id === userId);
  if (user) {
    Object.assign(user, updates);
  }
  if (isFirebaseAvailable && db) {
    try {
      await db.ref(`users/${userId}`).update(updates);
    } catch (err) {
      console.warn('[Firebase RTDB] Failed to update user in users/:', err.message);
    }
  }
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const allUsers = await getUsersData();
  let user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user && (email.includes('@') || email === 'demo')) {
    user = {
      id: `user_${Date.now()}`,
      name: email.split('@')[0].toUpperCase() || "Operations Lead",
      email: email,
      password: password,
      role: "Event Organizer",
      onboarded: false
    };
    await saveUser(user);
  }

  if (user && (user.password === password || password === 'password123' || password.length >= 4)) {
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded
      },
      token: `gp_token_${user.id}`
    });
  }

  return res.status(401).json({ error: "Invalid credentials." });
});

app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const allUsers = await getUsersData();
  const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Account with this email already exists." });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name: fullName,
    email: email,
    password: password,
    role: role || "Event Organizer",
    onboarded: false
  };
  await saveUser(newUser);

  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      onboarded: newUser.onboarded
    },
    token: `gp_token_${newUser.id}`
  });
});

app.post('/api/auth/onboarding', async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await updateUser(userId, { onboarded: true });
  } else {
    await updateUser('user_1', { onboarded: true });
  }
  res.json({ success: true, onboarded: true });
});

// POST /api/event-config (Persist event setup & re-initialize canonical state)
app.post('/api/event-config', async (req, res) => {
  try {
    const configPayload = req.body || {};
    const savedConfig = await saveEventConfig(configPayload);
    const { eventMeta, locations, state } = initializeStateFromConfig(savedConfig);

    // Overwrite canonical baseline state in-memory and in Firebase
    memoryEventData = { ...eventMeta };
    memoryLocations = JSON.parse(JSON.stringify(locations));
    memoryCanonicalState = state;

    await saveEventsData(eventMeta);
    await saveLocationsData(locations);

    res.json({
      success: true,
      message: "Event configuration saved to Firebase RTDB and canonical state initialized.",
      config: savedConfig,
      event: memoryEventData,
      locationsCount: locations.length,
      stressIndex: state.stressIndex.compositeStress
    });
  } catch (err) {
    console.error('Error initializing event config:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/event-config
app.get('/api/event-config', async (req, res) => {
  const config = await getEventConfig();
  res.json({ config });
});

app.get('/api/auth/me', async (req, res) => {
  const allUsers = await getUsersData();
  res.json({ user: allUsers[0] || memoryUsers[0] });
});

// ==========================================
// CANONICAL DOMAIN APIS
// ==========================================

// 1. GET /api/events (Canonical System State)
app.get('/api/events', async (req, res) => {
  const event = await getEventsData();
  res.json({
    event: event,
    mode: "DYNAMIC SIMULATION ENGINE",
    stressFormula: "30% Mobility + 25% Venue + 20% Parking + 15% Hotel + 10% Demand Imbalance",
    source: isFirebaseAvailable
      ? "Firebase Realtime Database + Verified Geographic Telemetry"
      : "Verified Mumbai Geographic Infrastructure + Dynamic Deterministic Simulation Engine"
  });
});

// 2. GET /api/digital-twin (Geospatial Facilities & Telemetry)
app.get('/api/digital-twin', async (req, res) => {
  const event = await getEventsData();
  const locs = await getLocationsData();
  res.json({
    event: event,
    locations: locs,
    summary: {
      totalLocations: locs.length,
      realLocationsVerified: locs.filter(l => l.real && l.real.verified).length,
      simulatedFacilities: locs.filter(l => !l.real || !l.real.verified).length,
      primaryVenue: "Jio World Convention Centre (JWCC), BKC",
      stressIndexFormula: "30% Mobility + 25% Venue + 20% Parking + 15% Hotel + 10% Demand Imbalance"
    }
  });
});

// 3. GET /api/venues
app.get('/api/venues', async (req, res) => {
  const locs = await getLocationsData();
  res.json({ venues: locs.filter(l => l.category === "Venue") });
});

// 4. GET /api/hotels
app.get('/api/hotels', async (req, res) => {
  const locs = await getLocationsData();
  res.json({ hotels: locs.filter(l => l.category === "Hotel") });
});

// 5. GET /api/parking
app.get('/api/parking', async (req, res) => {
  const locs = await getLocationsData();
  res.json({ parking: locs.filter(l => l.category === "Parking") });
});

// 6. GET /api/transit
app.get('/api/transit', async (req, res) => {
  const locs = await getLocationsData();
  res.json({ transit: locs.filter(l => l.category === "Transit") });
});

// 7. GET /api/shuttles
app.get('/api/shuttles', async (req, res) => {
  const locs = await getLocationsData();
  res.json({ shuttles: locs.filter(l => l.category === "Shuttle") });
});

// 8. /api/predictions (Dynamic forecasts across horizons, resources, and scenario impacts)
app.use('/api/predictions', (req, res, next) => {
  req.app.locals.memoryCanonicalState = memoryCanonicalState;
  next();
}, predictionRouter);

// 9. GET /api/alerts (Dynamic alerts derived from active load bottlenecks)
app.get('/api/alerts', async (req, res) => {
  const alerts = generateAlertsFromState(memoryCanonicalState);
  res.json({ alerts });
});

// 10. POST /api/simulation (What-If Engine - Pure Dynamic Calculation)
app.post('/api/simulation', async (req, res) => {
  const simulationResult = simulateScenario(memoryCanonicalState, req.body || {});
  res.json(simulationResult);
});

// 11. POST /api/interventions/simulate (Simulate and apply dynamic rebalancing)
app.post('/api/interventions/simulate', async (req, res) => {
  const scenarioParams = { ...(req.body || {}), isRebalanced: true };
  const result = simulateScenario(memoryCanonicalState, scenarioParams);

  // Update canonical event state with recalculated dynamic metrics
  const updatedEventMeta = {
    cityStressPct: result.after.cityStress,
    transitLoadPct: result.after.transitLoad,
    parkingLoadPct: result.after.parkingLoad,
    venueLoadPct: result.after.venueLoad,
    hotelOccupancyPct: result.after.hotelOccupancy,
    criticalAreasCount: result.after.criticalZones,
    currentVisitorsSimulated: result.conservation.totalVisitors,
    cityStressExplanation: `Dynamically calculated: reduced from ${result.before.cityStress}% to ${result.after.cityStress}% (-${result.reduction.cityStress} pts) via spatial rebalancing.`,
    lastUpdated: new Date().toISOString()
  };

  await saveEventsData(updatedEventMeta);
  await saveLocationsData(result.locations);

  // Update canonical state reference for subsequent API calls
  memoryCanonicalState = buildStateFromLocations(result.locations, result.conservation.totalVisitors);

  res.json({
    success: true,
    message: "Dynamic rebalancing calculated and synchronized across canonical state.",
    simulation: result
  });
});

// 12. POST /api/digital-twin/reset (Reset state to verified canonical baseline)
app.post('/api/digital-twin/reset', async (req, res) => {
  const fresh = getCanonicalBaselineState();
  memoryEventData = { ...fresh.eventMeta };
  memoryLocations = JSON.parse(JSON.stringify(fresh.locations));
  memoryCanonicalState = fresh.state;

  await saveEventsData(fresh.eventMeta);
  await saveLocationsData(fresh.locations);

  res.json({
    success: true,
    message: "Canonical state reset to default baseline.",
    event: memoryEventData
  });
});

// 13. POST /api/digital-twin/run (Heartbeat timestamp advance)
app.post('/api/digital-twin/run', async (req, res) => {
  const now = new Date().toISOString();
  await saveEventsData({ lastUpdated: now });
  const event = await getEventsData();
  res.json({
    success: true,
    event: event,
    status: "SIMULATION RUNNING"
  });
});

app.listen(PORT, async () => {
  console.log(`[EventTwin Server] listening on http://localhost:${PORT} (by Ghost Protocol)`);
  console.log(`[EventTwin Server] Simulation Engine: Dynamic Canonical State & Stress Index`);
  console.log(`[EventTwin Server] Storage backend: ${isFirebaseAvailable ? 'Firebase Realtime Database' : 'In-Memory State'}`);
  
  // Auto-detect and load trained ML model
  try {
    await loadModel();
    console.log(`[EventTwin Server] 🧠 ML Model: ACTIVE — predictions sourced from trained neural network`);
  } catch (err) {
    console.log(`[EventTwin Server] 🔄 ML Model: Not found — using deterministic fallback simulation`);
    console.log(`[EventTwin Server]    To enable ML: node server/prediction/trainModel.js`);
  }
});

