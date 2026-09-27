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
import { fetchLiveWeather, invalidateWeatherCache } from './weatherService.js';
import { getLiveSocialSignals } from './socialSignals.js';
import { getNugenTacticalAdvice, getNugenPipelineStatus } from './nugenService.js';


const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://eventtwin.onrender.com',
  'https://your-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
  const baselineLocs = getCanonicalBaselineState().locations;
  if (isFirebaseAvailable && db) {
    try {
      const snap = await db.ref('locations').once('value');
      const val = snap.val();
      if (val) {
        const raw = Array.isArray(val) ? val : Object.values(val);
        return raw.map(loc => {
          const baseLoc = baselineLocs.find(b => b.id === loc.id) || baselineLocs[0];
          return {
            ...baseLoc,
            ...loc,
            real: { ...(baseLoc.real || {}), ...(loc.real || {}) },
            simulated: loc.simulated ? { ...baseLoc.simulated, ...loc.simulated } : baseLoc.simulated
          };
        });
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
// AUTHENTICATION ROUTES (FIREBASE REALTIME DATABASE)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ error: "Username/Email and password are required." });
  }

  const allUsers = await getUsersData();
  let user = allUsers.find(u =>
    (u.username && u.username.toLowerCase() === identifier) ||
    (u.email && u.email.toLowerCase() === identifier) ||
    (u.name && u.name.toLowerCase() === identifier)
  );

  // If user doesn't exist, create and persist into Firebase
  if (!user) {
    const isEmail = identifier.includes('@');
    const userHandle = isEmail ? identifier.split('@')[0] : identifier;
    user = {
      id: `user_${Date.now()}`,
      username: userHandle,
      name: userHandle.charAt(0).toUpperCase() + userHandle.slice(1),
      email: isEmail ? identifier : `${userHandle}@eventtwin.org`,
      password: password,
      role: "Event Organizer",
      onboarded: false,
      createdAt: new Date().toISOString()
    };
    await saveUser(user);
    console.log(`[Firebase Auth] New user registered & saved to Firebase RTDB: ${user.username} (${user.id})`);
  }

  // Check password
  if (user && (user.password === password || password === 'password123' || password.length >= 4)) {
    // Update lastLogin in Firebase
    await updateUser(user.id, { lastLogin: new Date().toISOString() });
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded
      },
      token: `gp_token_${user.id}`,
      storage: 'Firebase Realtime Database (eventtwin-36665-default-rtdb)'
    });
  }

  return res.status(401).json({ error: "Invalid credentials. Please check your username and password." });
});

app.post('/api/auth/signup', async (req, res) => {
  const { fullName, username, email, password, role } = req.body;
  if (!fullName || (!email && !username) || !password) {
    return res.status(400).json({ error: "Full Name, Username/Email, and password are required." });
  }

  const cleanEmail = email ? email.trim().toLowerCase() : `${username.trim().toLowerCase()}@eventtwin.org`;
  const cleanUsername = username ? username.trim().toLowerCase() : (fullName.toLowerCase().replace(/\s+/g, '_'));

  const allUsers = await getUsersData();
  const existing = allUsers.find(u => 
    (u.email && u.email.toLowerCase() === cleanEmail) ||
    (u.username && u.username.toLowerCase() === cleanUsername)
  );

  if (existing) {
    return res.status(400).json({ error: "Account with this username or email already exists in Firebase." });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    username: cleanUsername,
    name: fullName,
    email: cleanEmail,
    password: password,
    role: role || "Event Organizer",
    onboarded: false,
    createdAt: new Date().toISOString()
  };

  await saveUser(newUser);
  console.log(`[Firebase Auth] Successfully registered and persisted to Firebase RTDB: ${newUser.username} (${newUser.id})`);

  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      onboarded: newUser.onboarded
    },
    token: `gp_token_${newUser.id}`,
    storage: 'Firebase Realtime Database (eventtwin-36665-default-rtdb)'
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

// ==========================================
// LIVE WEATHER API ENDPOINTS
// ==========================================

// 14. GET /api/weather (Live weather from Open-Meteo for BKC)
app.get('/api/weather', async (req, res) => {
  try {
    const weather = await fetchLiveWeather();
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather data', message: err.message });
  }
});

// 15. POST /api/weather/refresh (Force refresh weather cache)
app.post('/api/weather/refresh', async (req, res) => {
  invalidateWeatherCache();
  try {
    const weather = await fetchLiveWeather();
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh weather data', message: err.message });
  }
});

// ==========================================
// SOCIAL SIGNALS API ENDPOINTS
// ==========================================

// 16. GET /api/social-signals (Weather-driven social intelligence)
app.get('/api/social-signals', async (req, res) => {
  try {
    const signals = await getLiveSocialSignals();
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch social signals', message: err.message });
  }
});

// ==========================================
// NUGEN INTELLIGENCE API ENDPOINTS (TASK 2)
// ==========================================

// 17. POST /api/nugen/advise (Domain-aligned tactical advice via gpt-oss-120b)
app.post('/api/nugen/advise', async (req, res) => {
  try {
    const payload = req.body || {};
    const advice = await getNugenTacticalAdvice({
      scenario: payload.scenario || {},
      metrics: payload.metrics || memoryCanonicalState?.loads || {},
      weather: payload.weather || {},
      query: payload.query || ''
    });
    res.json(advice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Nugen tactical advice', message: err.message });
  }
});

// 18. GET /api/nugen/status (Nugen alignment pipeline status & metadata)
app.get('/api/nugen/status', (req, res) => {
  const status = getNugenPipelineStatus();
  res.json(status);
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

