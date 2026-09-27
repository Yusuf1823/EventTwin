import fs from 'fs';

const NUGEN_API_KEY = process.env.NUGEN_API_KEY || 'nugen-b472e9f5db8d6d19';
const BASE_URL = 'https://api.nugen.in/api/v3';

async function createAlignment() {
  const payload = {
    alignment_name: 'EventTwin-BKC-Operations-Alignment',
    base_model_id: 'llama-v3p2-3b-reasoning',
    document_ids: ['document_01m3fx1747zmmhh3'],
    description: 'Domain alignment for EventTwin: JWCC BKC mega-event operations, crowd surge mitigation, monsoon hospitality ripple effects, and spatial rebalancing.'
  };

  console.log('[Nugen] Creating Domain Alignment Project with payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/alignment-projects/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NUGEN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log(`[Nugen] Response status: ${response.status}`);
  try {
    const json = JSON.parse(text);
    console.log('[Nugen] Alignment Project Created:', JSON.stringify(json, null, 2));
    
    // Save metadata
    fs.writeFileSync('server/nugen/alignment_project.json', JSON.stringify({
      ...json,
      createdAt: new Date().toISOString(),
      baseModel: 'llama-v3p2-3b-reasoning',
      documentId: 'document_01m3fx1747zmmhh3'
    }, null, 2));

    return json;
  } catch (err) {
    console.log('[Nugen] Raw response:', text);
  }
}

createAlignment().catch(console.error);
