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
    console.log('[Firebase RTDB] Initialized successfully with:', DATABASE_URL);
  } else {
    console.warn('[Firebase RTDB] Warning: serviceAccountKey.json not found. Falling back to in-memory data.');
  }
} catch (error) {
  console.warn('[Firebase RTDB] Initialization warning (falling back to in-memory storage):', error.message);
  db = null;
  isFirebaseAvailable = false;
}

export { db, isFirebaseAvailable };
export default db;
