// This runs as a Vite dev server middleware or can be deployed as an edge function
// For production, deploy to Supabase Edge Functions or a separate serverless function

import Anthropic from '@anthropic-ai/sdk'
import type { UserStats, Word } from '../types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeProgress(stats: UserStats) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an English learning coach for Thai students preparing for the TAS NIDA entrance exam.

Analyze this student's progress and provide feedback in Thai:
- Current level: ${stats.current_level}
- Words mastered: ${stats.words_mastered}
- Words learning: ${stats.words_learning}
- Total words seen: ${stats.total_words_seen}
- Accuracy rate: ${Math.round(stats.accuracy_rate * 100)}%

Respond with a JSON object (no markdown, pure JSON):
{
  "current_level": "${stats.current_level}",
  "strengths": ["strength 1 in Thai", "strength 2 in Thai"],
  "weaknesses": ["weakness 1 in Thai", "weakness 2 in Thai"],
  "recommended_focus": ["academic", "formal"],
  "daily_goal": 20,
  "encouragement": "encouraging message in Thai (2-3 sentences)",
  "next_milestone": "what to achieve next in Thai"
}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  return JSON.parse(text)
}

export async function explainWord(word: Word) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Explain the English word "${word.word}" for a Thai student preparing for NIDA entrance exam.

Provide:
1. Memory tip in Thai (mnemonic or association)
2. Common mistake Thai speakers make
3. Academic usage example

Keep it concise and practical. Respond in Thai mixed with English examples.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

export async function generateHint(word: Word) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Give a short hint in Thai to help remember the word "${word.word}" (meaning: ${word.definition}).
Keep it to 1-2 sentences only.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
