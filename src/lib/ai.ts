import type { UserStats, AIAnalysis, Word, CEFRLevel } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const AI_ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-analyze`

async function callAI<T>(action: string, payload: unknown): Promise<T> {
  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, payload }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`AI ${action} failed [${res.status}]: ${body || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function analyzeProgress(stats: UserStats): Promise<AIAnalysis> {
  return callAI<AIAnalysis>('analyze', { stats })
}

export async function getWordExplanation(word: Word): Promise<string> {
  const data = await callAI<{ explanation: string }>('explain', { word })
  return data.explanation
}

export async function generateQuizHint(word: Word): Promise<string> {
  const data = await callAI<{ hint: string }>('hint', { word })
  return data.hint
}

export function levelToThai(level: CEFRLevel): string {
  const map: Record<CEFRLevel, string> = {
    A1: 'ผู้เริ่มต้น',
    A2: 'พื้นฐาน',
    B1: 'กลาง',
    B2: 'กลาง-สูง',
    C1: 'สูง',
    C2: 'เชี่ยวชาญ',
  }
  return map[level]
}

export function levelToColor(level: CEFRLevel): string {
  const map: Record<CEFRLevel, string> = {
    A1: 'bg-green-100 text-green-700',
    A2: 'bg-teal-100 text-teal-700',
    B1: 'bg-blue-100 text-blue-700',
    B2: 'bg-indigo-100 text-indigo-700',
    C1: 'bg-purple-100 text-purple-700',
    C2: 'bg-red-100 text-red-700',
  }
  return map[level]
}
