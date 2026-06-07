// Supabase Edge Function: AI Analysis
// Deploy: supabase functions deploy ai-analyze

import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { action, payload } = await req.json()

    let responseText = ''

    // Strip markdown code fences that models sometimes add around JSON
    function stripJson(text: string): string {
      return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    }

    if (action === 'analyze') {
      const { stats } = payload
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are an English learning coach for Thai students preparing for TAS NIDA entrance exam.

Student progress:
- Current level: ${stats.current_level}
- Words mastered: ${stats.words_mastered}
- Words learning: ${stats.words_learning}
- Accuracy rate: ${Math.round(stats.accuracy_rate * 100)}%

Respond ONLY with pure JSON (no markdown):
{
  "current_level": "${stats.current_level}",
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2"],
  "weaknesses": ["จุดอ่อน 1", "จุดอ่อน 2"],
  "recommended_focus": ["academic", "formal"],
  "daily_goal": 20,
  "encouragement": "ข้อความให้กำลังใจ 2-3 ประโยคในภาษาไทย",
  "next_milestone": "เป้าหมายถัดไปในภาษาไทย"
}`,
          },
        ],
      })
      responseText = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      const result = JSON.parse(stripJson(responseText))
      return Response.json(result, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (action === 'explain') {
      const { word } = payload
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `อธิบายคำว่า "${word.word}" (${word.definition}) ให้นักเรียนไทยที่เตรียมสอบ NIDA เข้าใจ:
1. เทคนิคจำ (1-2 ประโยค)
2. ข้อผิดพลาดที่มักพบ
3. ตัวอย่างประโยคเชิงวิชาการ
กระชับ ไม่เกิน 5-6 ประโยค`,
          },
        ],
      })
      responseText = msg.content[0].type === 'text' ? msg.content[0].text : ''
      return Response.json({ explanation: responseText }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (action === 'hint') {
      const { word } = payload
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `ให้ hint จำคำว่า "${word.word}" (ความหมาย: ${word.thai_meaning}) ใน 1-2 ประโยคภาษาไทย`,
          },
        ],
      })
      responseText = msg.content[0].type === 'text' ? msg.content[0].text : ''
      return Response.json({ hint: responseText }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (action === 'generate_vocab') {
      const { level, category, count, existingWords } = payload as {
        level: string; category: string; count: number; existingWords: string[]
      }
      const existing = existingWords.slice(0, 50).join(', ')
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Generate ${count} unique English vocabulary words for Thai students preparing for NIDA entrance exam.

Requirements:
- CEFR level: ${level}
- Category: ${category} (academic/formal/general/business)
- Words must NOT be in this existing list: ${existing}
- Each word must be appropriate for academic Thai university entrance exam (NIDA TAS)
- Include Thai translation

Respond ONLY with pure JSON array (no markdown):
[
  {
    "word": "...",
    "definition": "clear English definition",
    "thai_meaning": "ความหมายภาษาไทย",
    "example_sentence": "Academic example sentence.",
    "part_of_speech": "noun|verb|adjective|adverb|phrase",
    "synonyms": ["word1", "word2"]
  }
]`,
        }],
      })
      const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
      const words = JSON.parse(stripJson(text))
      return Response.json({ words }, { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    if (action === 'enrich_word') {
      const { word } = payload as { word: string }
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Provide complete information for the English word "${word}" for Thai NIDA exam preparation.

Respond ONLY with pure JSON (no markdown):
{
  "definition": "clear English definition",
  "thai_meaning": "ความหมายภาษาไทย",
  "example_sentence": "Academic example sentence.",
  "part_of_speech": "noun|verb|adjective|adverb|phrase",
  "level": "A1|A2|B1|B2|C1|C2",
  "synonyms": ["word1", "word2"]
}`,
        }],
      })
      const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      return Response.json(JSON.parse(stripJson(text)), { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: String(err) }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
})
