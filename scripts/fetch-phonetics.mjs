#!/usr/bin/env node
/**
 * fetch-phonetics.mjs — ดึง IPA phonetics จาก Free Dictionary API แล้วอัพเดท DB
 *
 * Usage:
 *   node scripts/fetch-phonetics.mjs          # อัพเดทคำที่ยังไม่มี phonetic
 *   node scripts/fetch-phonetics.mjs --all    # อัพเดทใหม่ทุกคำ
 */

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')
const DELAY_MS = 120 // ms ระหว่าง request เพื่อไม่ให้ rate limit
const overwriteAll = process.argv.includes('--all')

// --- ดึง words จาก DB ---
console.log(`Fetching words from database${overwriteAll ? ' (all)' : ' (missing phonetic only)'}...`)
const whereClause = overwriteAll ? '' : "WHERE phonetic IS NULL OR phonetic = ''"
const raw = execSync(
  `supabase db query --linked "SELECT word FROM words ${whereClause} ORDER BY word;" --output json`,
  { encoding: 'utf-8', cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }
)

const match = raw.match(/"rows"\s*:\s*(\[[\s\S]*?\])/)
const words = match ? JSON.parse(match[1]).map(r => r.word) : []
console.log(`Found ${words.length} words to process\n`)

if (!words.length) {
  console.log('All words already have phonetics. Use --all to refresh.')
  process.exit(0)
}

// --- ดึง phonetic จาก Free Dictionary API ---
async function fetchPhonetic(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!res.ok) return null
    const data = await res.json()
    // ลองหา phonetic จากหลาย field
    const entry = data[0]
    if (!entry) return null
    // 1. phonetic text ตรงๆ
    if (entry.phonetic) return entry.phonetic
    // 2. หาจาก phonetics array ที่มี audio (UK/US)
    const withAudio = entry.phonetics?.find(p => p.text && p.audio?.includes('us'))
    if (withAudio?.text) return withAudio.text
    // 3. อันแรกที่มี text
    const withText = entry.phonetics?.find(p => p.text)
    return withText?.text ?? null
  } catch {
    return null
  }
}

// --- process ทีละคำ ---
const results = [] // { word, phonetic }
let found = 0
let notFound = 0

for (let i = 0; i < words.length; i++) {
  const word = words[i]
  process.stdout.write(`[${i + 1}/${words.length}] ${word.padEnd(25)} `)

  const phonetic = await fetchPhonetic(word)
  if (phonetic) {
    results.push({ word, phonetic })
    process.stdout.write(`${phonetic}\n`)
    found++
  } else {
    process.stdout.write('(not found)\n')
    notFound++
  }

  // batch update ทุก 50 คำ
  if (results.length >= 50) {
    await flushToDB(results.splice(0, results.length))
  }

  if (i < words.length - 1) await sleep(DELAY_MS)
}

// flush ที่เหลือ
if (results.length > 0) {
  await flushToDB(results)
}

console.log(`\nDone! Found: ${found}, Not found: ${notFound}`)

// --- insert phonetics to DB ---
async function flushToDB(batch) {
  if (!batch.length) return
  const esc = s => s.replace(/'/g, "''")
  const cases = batch.map(({ word, phonetic }) =>
    `WHEN word = '${esc(word)}' THEN '${esc(phonetic)}'`
  ).join('\n  ')
  const wordList = batch.map(({ word }) => `'${esc(word)}'`).join(', ')

  const sql = `UPDATE words SET phonetic = CASE\n  ${cases}\n  ELSE phonetic END\nWHERE word IN (${wordList});`

  const tmp = join(root, '.tmp-phonetic.sql')
  writeFileSync(tmp, sql)
  try {
    execSync(`supabase db query --linked --file .tmp-phonetic.sql`, {
      cwd: root, stdio: ['pipe', 'pipe', 'pipe']
    })
    process.stdout.write(`  → Saved ${batch.length} phonetics to DB\n`)
  } finally {
    try { unlinkSync(tmp) } catch {}
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
