import type { CEFRLevel, WordCategory, Word } from '@/types'

const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT ?? '/api/ai-analyze'

export interface GeneratedWord {
  word: string
  definition: string
  thai_meaning: string
  example_sentence: string
  part_of_speech: string
  synonyms: string[]
}

export async function generateVocabulary(
  level: CEFRLevel,
  category: WordCategory,
  count: number,
  existingWords: string[]
): Promise<GeneratedWord[]> {
  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_vocab',
      payload: { level, category, count, existingWords },
    }),
  })
  if (!res.ok) throw new Error('AI generate failed')
  const data = await res.json()
  return data.words as GeneratedWord[]
}

export async function enrichWord(word: string): Promise<Partial<Word>> {
  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'enrich_word', payload: { word } }),
  })
  if (!res.ok) throw new Error('AI enrich failed')
  return res.json()
}
