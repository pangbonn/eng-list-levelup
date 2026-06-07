# VocabMaster NIDA — Setup Guide

## ขั้นตอนการติดตั้ง

### 1. Supabase Setup

1. ไปที่ [supabase.com](https://supabase.com) และสร้าง project ใหม่
2. ไปที่ **SQL Editor** แล้ว run ไฟล์ `supabase/schema.sql` ทั้งหมด
3. ไปที่ **Settings → API** แล้วก็อป:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 2. Environment Variables

```bash
cp .env.example .env
```

แก้ไข `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run Development Server

```bash
npm install
npm run dev
```

เปิด http://localhost:5173

### 4. AI Setup (Supabase Edge Function)

```bash
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Set secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy edge function
supabase functions deploy ai-analyze --project-ref your-project-ref
```

แล้วแก้ไข `src/lib/ai.ts` ให้ใช้ edge function URL:
```ts
const AI_ENDPOINT = 'https://your-project-ref.supabase.co/functions/v1/ai-analyze'
```

## Features

| Feature | Description |
|---------|-------------|
| 🃏 Flashcards | เรียนคำศัพท์แบบ flip card พร้อม Spaced Repetition (SM-2) |
| 📝 Quiz | Multiple Choice และ Fill in the Blank |
| 📊 Level Assessment | วัดระดับ CEFR (A1-C2) จาก quiz performance |
| 🤖 AI Analysis | Claude วิเคราะห์จุดแข็ง/จุดอ่อน และแนะนำแผนการเรียน |
| 📖 Vocabulary | ค้นหาและกรองคำศัพท์ตามระดับและหมวดหมู่ |
| 🔥 Streak | ติดตาม streak การเรียนรายวัน |

## CEFR Levels สำหรับ TAS NIDA

- A1, A2 — พื้นฐาน (ยังต้องพัฒนาอีกมาก)
- B1 — กลาง (ใกล้เพียงพอ)
- **B2** — 🎯 **เป้าหมายขั้นต่ำสำหรับ NIDA**
- C1, C2 — สูง (ยอดเยี่ยม)

## Spaced Repetition

ใช้อัลกอริทึม SM-2 ในการกำหนดช่วงเวลาทบทวน:
- ตอบถูก → ช่วงเวลาเพิ่มขึ้น (ease factor × interval)
- ตอบผิด → รีเซ็ตกลับเป็น 1 วัน
- Mastered = ตอบถูก ≥ 5 ครั้ง และ accuracy ≥ 80%
