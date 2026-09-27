import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUGEN_API_KEY = process.env.NUGEN_API_KEY || 'nugen-b472e9f5db8d6d19';
const BASE_URL = 'https://api.nugen.in/api/v3';

async function uploadCorpus() {
  const filePath = path.join(__dirname, 'eventtwin_domain_corpus.txt');
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'text/plain' });

  const formData = new FormData();
  formData.append('files', blob, 'eventtwin_domain_corpus.txt');
  formData.append('categories', 'urban-mobility');
  formData.append('names', 'EventTwin Domain Knowledge Corpus');

  console.log('[Nugen] Uploading domain corpus document to Nugen Intelligence...');

  const response = await fetch(`${BASE_URL}/documents/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NUGEN_API_KEY}`
    },
    body: formData
  });

  const text = await response.text();
  console.log(`[Nugen] Response status: ${response.status}`);
  try {
    const json = JSON.parse(text);
    console.log('[Nugen] Document Upload Result:', JSON.stringify(json, null, 2));
    return json;
  } catch (err) {
    console.log('[Nugen] Raw response:', text);
  }
}

uploadCorpus().catch(console.error);
