#!/usr/bin/env node
/**
 * add-vocab.mjs — เพิ่มคำศัพท์ NIDA ผ่าน AI อัตโนมัติ
 *
 * Usage:
 *   node scripts/add-vocab.mjs <level> <category> [count]
 *
 * Examples:
 *   node scripts/add-vocab.mjs B2 business 20
 *   node scripts/add-vocab.mjs C1 formal 15
 *   node scripts/add-vocab.mjs B1 social 10
 *
 * Levels:    A1 | A2 | B1 | B2 | C1 | C2
 * Categories: academic | general | business | science | social | idiom | formal
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// --- Load .env ---
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf-8').split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  } catch {
    console.error('ERROR: Cannot read .env file');
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env');
  process.exit(1);
}

// --- Validate args ---
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_CATEGORIES = ['academic', 'general', 'business', 'science', 'social', 'idiom', 'formal'];

const [level, category, countStr] = process.argv.slice(2);

if (!level || !VALID_LEVELS.includes(level) || !category || !VALID_CATEGORIES.includes(category)) {
  console.log('Usage: node scripts/add-vocab.mjs <level> <category> [count]');
  console.log(`  level:    ${VALID_LEVELS.join(' | ')}`);
  console.log(`  category: ${VALID_CATEGORIES.join(' | ')}`);
  console.log(`  count:    how many words to generate (default 20, max 50)`);
  process.exit(0);
}
const count = Math.min(50, Math.max(5, parseInt(countStr || '20') || 20));

// --- Step 1: Fetch existing words to avoid duplicates ---
console.log(`[1/3] Fetching existing ${level} ${category} words...`);
let existingWords = [];
try {
  const raw = execSync(
    `supabase db query --linked "SELECT word FROM words WHERE level='${level}' AND category='${category}';" --output json`,
    { encoding: 'utf-8', cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }
  );
  const match = raw.match(/"rows"\s*:\s*(\[[\s\S]*?\])/);
  if (match) existingWords = JSON.parse(match[1]).map(r => r.word);
} catch {
  console.warn('  Warning: Could not fetch existing words, proceeding without deduplication');
}
console.log(`  Found ${existingWords.length} existing words in this level/category`);

// --- Step 2: Call AI edge function ---
console.log(`[2/3] Calling AI to generate ${count} new words...`);
const edgeUrl = `${SUPABASE_URL}/functions/v1/ai-analyze`;

let words = [];
try {
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'generate_vocab',
      payload: { level, category, count, existingWords },
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    console.error(`  Edge function error (${res.status}):`, msg);
    process.exit(1);
  }

  const json = await res.json();
  words = json.words || [];
} catch (err) {
  console.error('  Failed to call edge function:', err.message);
  process.exit(1);
}

if (!words.length) {
  console.log('  No words returned. Done.');
  process.exit(0);
}
console.log(`  AI generated ${words.length} words`);

// --- Step 3: Build SQL and insert ---
console.log('[3/3] Inserting into database...');

const VALID_POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase']);
const esc = s => (s || '').replace(/'/g, "''").replace(/\n/g, ' ').trim();

const rows = words
  .filter(w => w.word && w.definition && w.thai_meaning)
  .map(w => {
    const pos = VALID_POS.has(w.part_of_speech) ? w.part_of_speech : 'noun';
    const syns = Array.isArray(w.synonyms) && w.synonyms.length
      ? `ARRAY[${w.synonyms.slice(0, 5).map(s => `'${esc(s)}'`).join(', ')}]`
      : "'{}'";
    return `('${esc(w.word)}', '${esc(w.definition)}', '${esc(w.thai_meaning)}', '${esc(w.example_sentence || '')}', '${pos}', '${level}', '${category}', 70, ${syns})`;
  });

if (!rows.length) {
  console.log('  No valid words to insert.');
  process.exit(0);
}

const sql = [
  `-- AI-generated vocabulary: ${level}/${category} (${new Date().toISOString()})`,
  `INSERT INTO words (word, definition, thai_meaning, example_sentence, part_of_speech, level, category, frequency, synonyms) VALUES`,
  rows.join(',\n'),
  `ON CONFLICT (word) DO NOTHING;`,
].join('\n');

const tmpFile = join(root, '.tmp-vocab.sql');
writeFileSync(tmpFile, sql);

try {
  execSync(`supabase db query --linked --file .tmp-vocab.sql`, {
    stdio: 'inherit',
    cwd: root,
  });

  // Show updated count
  const countRaw = execSync(
    `supabase db query --linked "SELECT COUNT(*) as total FROM words WHERE level='${level}' AND category='${category}';" --output json`,
    { encoding: 'utf-8', cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }
  );
  const countMatch = countRaw.match(/"total"\s*:\s*"?(\d+)"?/);
  const total = countMatch ? countMatch[1] : '?';

  console.log(`\nDone! Added up to ${words.length} new words.`);
  console.log(`Total ${level} ${category} words in DB: ${total}`);
} finally {
  try { unlinkSync(tmpFile); } catch {}
}
