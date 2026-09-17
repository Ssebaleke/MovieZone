import { reelplexiFetch } from './services/reelplexi.js';
const res = await reelplexiFetch('/movies', { per_page: 3, page: 1 });
if (!res) { console.log('NULL - no API key or API down'); process.exit(0); }
const items = res.data || res.results || res.movies || [];
console.log('SAMPLE:', JSON.stringify(items.slice(0, 2), null, 2));
