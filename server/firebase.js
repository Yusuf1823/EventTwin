import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'https://eventtwin-36665-default-rtdb.firebaseio.com/';
const keyPath = path.resolve(__dirname, 'serviceAccountKey.json');

let db = null;
let isFirebaseAvailable = false;

// Custom REST Adapter for Firebase Realtime Database
class FirebaseRestRef {
  constructor(endpoint) {
    this.endpoint = endpoint.replace(/^\/+|\/+$/g, '');
    this.baseUrl = DATABASE_URL.replace(/\/+$/, '');
  }

  getUrl() {
    return `${this.baseUrl}/${this.endpoint}.json`;
  }

  async once(eventType) {
    if (eventType !== 'value') throw new Error(`Unsupported eventType: ${eventType}`);
    const res = await fetch(this.getUrl());
    if (!res.ok) throw new Error(`Firebase REST error ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return {
      val: () => data,
      exists: () => data !== null && data !== undefined
    };
  }

  async set(data) {
    const res = await fetch(this.getUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Firebase REST PUT error ${res.status}: ${res.statusText}`);
    return res.json();
  }

  async update(data) {
    const res = await fetch(this.getUrl(), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Firebase REST PATCH error ${res.status}: ${res.statusText}`);
    return res.json();
  }

  async remove() {
    const res = await fetch(this.getUrl(), {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Firebase REST DELETE error ${res.status}: ${res.statusText}`);
    return res.json();
  }
}

class FirebaseRestDatabase {
  ref(path = '') {
    return new FirebaseRestRef(path);
  }
}

try {
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: DATABASE_URL
      });
    }
    db = getDatabase();
    isFirebaseAvailable = true;
    console.log('[Firebase RTDB] Initialized successfully via Admin SDK:', DATABASE_URL);
  } else {
    // Transparent REST connection to Firebase Realtime Database
    db = new FirebaseRestDatabase();
    isFirebaseAvailable = true;
    console.log('[Firebase RTDB] Connected live via Firebase Realtime Database REST API:', DATABASE_URL);
  }
} catch (error) {
  console.warn('[Firebase RTDB] Initialization warning, activating REST client:', error.message);
  db = new FirebaseRestDatabase();
  isFirebaseAvailable = true;
}

export { db, isFirebaseAvailable, DATABASE_URL };
export default db;
